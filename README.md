# Secret Santa Board

An anonymous board for each person in the exchange. Everyone can ask questions about someone's taste or post gift ideas. You can't see your own board.

- `public/`: the site (plain HTML/JS, Firebase loaded from Google's CDN, so no build step and no `npm install firebase`)
- `public/config.js`: Firebase config and **the list of participants** (edit this)
- `firestore.rules`: database rules. Anyone can read and add posts and replies. Nobody can edit or delete. No author is stored.

## Deploy (one time, from your computer)

You need Node.js installed (https://nodejs.org).

```sh
npm install -g firebase-tools   # installs the Firebase command-line tool
firebase login                  # opens a browser to sign in
cd secret-santa-board
firebase deploy                 # uploads the rules and the site
```

The site will be at https://secret-santa-secrets.web.app

To update it later (for example after changing names), run `firebase deploy` again.

## How "hidden" works

Each person picks their name the first time they open the site, and their device remembers it. Their own board is then hidden from them. It's an honor system: someone could pick another name to peek.
