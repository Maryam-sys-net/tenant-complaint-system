# Tenant Complaint Management System (frontend)

React + Vite + Tailwind CSS + React Router. No backend yet: data is kept in the browser (localStorage), all through `src/lib/api.js`.

## Run

```
npm install
npm run dev
```

Open the address shown in the terminal (usually http://localhost:5173).

## Demo logins

| Who | Password |
| --- | --- |
| Unit 1 to 5 | `unit1pass` ... `unit5pass` |
| Management | `manage123` |

## Adding the backend later

Only `src/lib/api.js` talks to storage. Replace its functions with Supabase calls; the pages stay the same.

To reset the demo data, clear this site's localStorage in browser dev tools.
