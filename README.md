# Sports Market Lab

Build a responsive web app called “Sports Market Lab”.

Purpose:

This app is a classroom-friendly sports prediction market simulator where users trade outcome shares using virtual money. It should feel like a simple prediction exchange, not a sportsbook. The system must be deterministic and math-based, not AI-based.

Core requirements:

- Responsive modern interface for desktop and mobile

- Clean sports-themed dashboard

- User authentication with email/password

- Two main roles:

  1. Admin

  2. Student/User

- Use virtual currency only

- Each new user starts with a configurable virtual cash balance

- Create a simple homepage explaining how the market works

- Include a logged-in dashboard

- Include a top nav with:

  - Dashboard

  - Markets

  - Portfolio

  - Leaderboard

  - How It Works

  - Admin (admin only)

Initial data structure:

- Users

- Markets

- Outcomes

- Trades

- Holdings

- Portfolio history

- Leaderboard stats

User dashboard should show:

- available cash

- total portfolio value

- open positions

- recent trades

- top movers

- upcoming events

Market pages should show:

- event title

- league/sport

- start time

- status

- outcomes with current prices

- buy/sell buttons

- simple price chart area placeholder

- market details

Admin area should include:

- create/edit sports markets

- set event date and time

- create outcomes for each market

- open/close/suspend/settle markets

- manually enter final result

- view all user activity

- reset season/classroom data

Important constraints:

- Do not use AI to calculate prices

- All pricing must be handled by app logic and formulas

- Build the app structure and UI first with placeholders where needed

- Use clear modular components so later prompts can add trading logic cleanly

Design style:

- modern, sharp, intuitive

- dark/light friendly

- cards, stats, tables, and charts

- sports analytics feel

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sport-odds-lab.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3546fc7f-c061-4b22-bc11-253fcd72517f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
