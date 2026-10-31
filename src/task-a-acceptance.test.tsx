// Task A (Clinic opening hours): 10 acceptance tests, one per requirement in SPEC.md.
// Put this file in the src folder, then ask Claude: "Please run npm run acceptance".
// Do NOT change this file.
(globalThis as unknown as { process: { env: Record<string, string> } }).process.env.TZ = 'America/New_York'; // same time zone on every computer, so everyone is checked the same way
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import App from './App';

const norm = (s: string | null) => (s ?? '').replace(/\s+/g, ' ').replace(/\s*[-–—]\s*/g, '-').trim();
const setNow = (d: Date) => vi.setSystemTime(d);
const MONDAY_10AM = new Date(2026, 9, 26, 10, 0); // Monday 26 October 2026, 10:00

const servicesList = () => screen.queryByRole('list', { name: 'Services' });
const serviceNames = () => {
  const list = servicesList();
  return list ? within(list).queryAllByRole('listitem').map((li) => norm(li.textContent)) : [];
};
const has = (re: RegExp) => screen.queryAllByText(re).length > 0;
const at = (d: Date) => { setNow(d); return render(<App />); };

describe('Task A: Clinic opening hours', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    setNow(MONDAY_10AM);
  });
  afterEach(() => vi.useRealTimers());

  test('1. Heading, "Call us" link and disclaimer', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sunrise Community Clinic');
    expect(screen.getByRole('link', { name: 'Call us' })).toHaveAttribute('href', 'tel:+1-555-0100');
    expect(screen.getByText('This is a fictional clinic for practice. It does not give medical advice.')).toBeInTheDocument();
  });

  test('2. Opening hours list shows 7 days in order with times or Closed', () => {
    render(<App />);
    const items = within(screen.getByRole('list', { name: 'Opening hours' })).getAllByRole('listitem');
    expect(items).toHaveLength(7);
    const expected = ['Monday: 08:00-18:00', 'Tuesday: 08:00-18:00', 'Wednesday: 08:00-18:00', 'Thursday: 08:00-20:00', 'Friday: 08:00-16:00', 'Saturday: 09:00-13:00', 'Sunday: Closed'];
    items.forEach((li, i) => expect(norm(li.textContent)).toContain(expected[i]));
  });

  test('3. Today is marked with aria-current="date" (Monday and Sunday)', () => {
    const check = (day: string) => {
      const list = screen.getByRole('list', { name: 'Opening hours' });
      const marked = list.querySelectorAll('[aria-current="date"]');
      expect(marked).toHaveLength(1);
      expect(norm((marked[0].closest('li') ?? marked[0]).textContent)).toContain(day);
    };
    const first = render(<App />);
    check('Monday');
    first.unmount();
    at(new Date(2026, 10, 1, 11, 0)); // Sunday 1 November
    check('Sunday');
  });

  test('4. Open now: shows "Open now" and the closing time', () => {
    const first = render(<App />);
    expect(has(/open now/i)).toBe(true);
    expect(has(/closed now/i)).toBe(false);
    expect(has(/closes at 18:00/i)).toBe(true);
    first.unmount();
    at(new Date(2026, 9, 29, 19, 0)); // Thursday 19:00, open until 20:00
    expect(has(/open now/i)).toBe(true);
    expect(has(/closes at 20:00/i)).toBe(true);
  });

  test('5. Closed now: shows when the clinic opens next', () => {
    const cases: [Date, RegExp][] = [
      [new Date(2026, 9, 26, 18, 0), /opens at 08:00 on tuesday/i], // Monday at closing time
      [new Date(2026, 9, 26, 7, 0), /opens at 08:00 today/i], // Monday before opening
      [new Date(2026, 9, 31, 14, 0), /opens at 08:00 on monday/i], // Saturday afternoon, skips Sunday
      [new Date(2026, 10, 1, 11, 0), /opens at 08:00 on monday/i], // Sunday
    ];
    for (const [when, next] of cases) {
      const r = at(when);
      expect(has(/closed now/i)).toBe(true);
      expect(has(/open now/i)).toBe(false);
      expect(has(next)).toBe(true);
      r.unmount();
    }
  });

  test('6. Services sorted A to Z, with category and a count', () => {
    render(<App />);
    const names = serviceNames();
    const expected = ['Blood pressure check (Adults)', 'Blood test (Tests)', 'Child health check (Children)', 'Eye screening (Tests)', 'Flu vaccination (Vaccines)', 'General check-up (Adults)', 'Hearing test (Children)', 'Travel vaccines (Vaccines)'];
    expect(names).toHaveLength(8);
    expected.forEach((s, i) => expect(names[i]).toContain(norm(s)));
    expect(has(/showing 8 of 8 services/i)).toBe(true);
  });

  test('7. Search matches name or category, ignores case and outside spaces', async () => {
    const user = userEvent.setup();
    render(<App />);
    const box = screen.getByLabelText('Search services');
    await user.type(box, '  BLOOD ');
    expect(serviceNames()).toHaveLength(2);
    expect(has(/showing 2 of 8 services/i)).toBe(true);
    await user.clear(box);
    await user.type(box, 'test');
    const names = serviceNames();
    expect(names).toHaveLength(3);
    for (const s of ['Blood test', 'Eye screening', 'Hearing test']) expect(names.some((n) => n.includes(s))).toBe(true);
    expect(has(/showing 3 of 8 services/i)).toBe(true);
  });

  test('8. Category drop-down filters, and works together with search', async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByRole('combobox', { name: 'Category' });
    const options = within(select).getAllByRole('option').map((o) => norm(o.textContent));
    expect(options).toEqual(['All', 'Adults', 'Vaccines', 'Children', 'Tests']);
    await user.selectOptions(select, 'Vaccines');
    expect(serviceNames()).toHaveLength(2);
    await user.type(screen.getByLabelText('Search services'), 'flu');
    expect(serviceNames()).toHaveLength(1);
    expect(serviceNames()[0]).toContain('Flu vaccination');
  });

  test('9. No results message, and "Clear filters" resets everything', async () => {
    const user = userEvent.setup();
    render(<App />);
    const select = screen.getByRole('combobox', { name: 'Category' });
    await user.selectOptions(select, 'Children');
    await user.type(screen.getByLabelText('Search services'), 'xyz');
    expect(serviceNames()).toHaveLength(0);
    expect(screen.getByText('No services found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(serviceNames()).toHaveLength(8);
    expect(screen.getByLabelText('Search services')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('All');
    expect(screen.queryByText('No services found')).not.toBeInTheDocument();
  });

  test('10. Appointment request: checks the name and date, then thanks you', async () => {
    const user = userEvent.setup();
    render(<App />);
    const send = () => user.click(screen.getByRole('button', { name: 'Send request' }));
    const service = screen.getByRole('combobox', { name: 'Service' });
    const opts = within(service).getAllByRole('option').map((o) => norm(o.textContent));
    for (const s of ['Blood pressure check', 'Flu vaccination', 'Travel vaccines']) expect(opts).toContain(s);
    await send();
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Your first name'), 'Maya');
    const date = screen.getByLabelText('Date');
    expect(date).toHaveAttribute('type', 'date');
    await user.type(date, '2026-10-24'); // a Saturday in the past
    await send();
    expect(screen.getByText('Please choose a date from today onwards')).toBeInTheDocument();
    await user.clear(date);
    await user.type(date, '2026-11-01'); // a Sunday
    await send();
    expect(screen.getByText('The clinic is closed on Sundays')).toBeInTheDocument();
    await user.clear(date);
    await user.type(date, '2026-10-28'); // a Wednesday
    await user.selectOptions(service, 'Flu vaccination');
    await send();
    expect(screen.getByText('Thanks, Maya! We will call you about Flu vaccination on 2026-10-28.')).toBeInTheDocument();
  });
});
