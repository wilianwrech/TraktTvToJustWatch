### Script to import your Trakt.tv data to JustWatch.

Obs.: This script was created for my personal use, it was created to be useful for me, it was created in 3 hours, so be kind, don't judge it too much.

### What it does do?

It will take all your movies and shows ratings, set as liked or disliked.
All rated movies will be set as watched.
It will take your show's episodes watched and will set as watched.
**It will not do anything else!**
It is pretty slow, as this script does not use any API, there is not much to do, it could execute multiple imports simultaneously, but it's a risk to get banned.

### How to use it?

- You have to allow CORS in your browser to work (I use Chrome and [this extension](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf))
- Open [Just Watch](https://www.justwatch.com/)
- Login into Just Watch
- Copy the [source.js](https://github.com/wilianwrech/TraktTvToJustWatch/blob/master/source.js) content
- Execute the code into the Just Watch page
- Call the function traktTvToJustWatch('your-trakt-tv-username', likedIfGreaterThan = 5)
- Done

### Thanks
Thanks [Darek Kay](https://github.com/darekkay) for creating a [backup tool](https://darekkay.com/blog/trakt-tv-backup/) for Trakt.tv.