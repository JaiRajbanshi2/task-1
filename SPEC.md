# Challenge: Sunrise Community Clinic opening hours

Build a one-page website for a **fictional** clinic. All the information is in `src/data.json`.
Build it in `src/App.tsx` (you may add more components). `App` must stay the **default export**.
Nothing is sent or saved anywhere: this is a practice page.

Use the **exact words** shown in quotes below: the checker looks for them.

## Requirements

1. **Heading, phone and disclaimer.** The page has one main heading (`h1`) with the clinic name from `data.json`: "Sunrise Community Clinic". It has a link with the text "Call us" that opens the phone dialler: `href="tel:+1-555-0100"` (the phone number from `data.json`). It shows this exact sentence: "This is a fictional clinic for practice. It does not give medical advice."
2. **Opening hours.** Show a list labelled "Opening hours" (`aria-label="Opening hours"`) with 7 items, Monday to Sunday in that order. Each item reads like "Monday: 08:00-18:00" (day, colon, space, open time, hyphen, close time). A day with no hours reads "Sunday: Closed".
3. **Today.** The item for today's day of the week is highlighted (bold or coloured) and has `aria-current="date"`. No other item has it. This must also work on Sunday.
4. **Open now.** If the current time is between today's open time (included) and close time (not included), show "Open now" and the closing time, for example "Closes at 18:00".
5. **Closed now.** Otherwise show "Closed now" and when the clinic opens next:
   - later today: "Opens at 08:00 today"
   - on another day: "Opens at 08:00 on Tuesday" (skip days with no hours, so on Saturday afternoon it is "Opens at 08:00 on Monday").
6. **Services.** Show a list labelled "Services" (`aria-label="Services"`) with one item per service, sorted A to Z by name. Each item shows the name and the category in brackets, for example "Flu vaccination (Vaccines)". Above or below the list, show how many are visible, for example "Showing 8 of 8 services".
7. **Search.** A text box labelled "Search services" filters the list as you type. It matches any part of the **name or the category**, ignores upper or lower case, and ignores spaces at the start or end. For example "BLOOD" shows 2 services and "test" shows 3 (two names contain "test" and one more service is in the "Tests" category). The "Showing X of 8 services" text updates.
8. **Category filter.** A drop-down labelled "Category" has the options "All", "Adults", "Vaccines", "Children" and "Tests", in that order. Choosing a category shows only that category's services. Search and category work together.
9. **No results and clear.** When nothing matches, the Services list is empty and the page shows "No services found". A button "Clear filters" empties the search box, sets the category back to "All" and shows all 8 services again.
10. **Request an appointment.** A form with a text box labelled "Your first name", a drop-down labelled "Service" (all 8 service names, A to Z), a date box labelled "Date" (`type="date"`) and a button "Send request". When you click "Send request":
    - no name: show "Please enter your name"
    - no date, or a date before today: show "Please choose a date from today onwards"
    - a Sunday: show "The clinic is closed on Sundays"
    - otherwise show, for example, "Thanks, Maya! We will call you about Flu vaccination on 2026-10-28." (the name, the service and the date exactly as chosen).

## Tips

- Ask Claude for a plan first, then let it build one requirement at a time.
- Run `npm run dev` (ask Claude) and open the link to look at your page.
- Dates: 2026-11-01 is a Sunday. Work out the weekday from the year, month and day numbers, so it is right in every time zone.
- Make it look good with Tailwind CSS classes, but finish the requirements first.
