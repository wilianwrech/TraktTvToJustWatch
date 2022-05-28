(() => {
  async function getJustWatchLink(traktTvLink) {
    const response = await fetch(traktTvLink)
    const html = await response.text()
    const regex = /external-link-justwatch"\shref="(.*)">JustWatch/
    return regex.exec(html)?.[1]
  }

  async function getJustWatchIds(justWatchLink) {
    const response = await fetch(justWatchLink)
    const html = await response.text()
    const regexTitleId = /"id":"(Movie|Show):([0-9A-z]*)"/
    const regexEpisodesIds = /"id":"Episode:([0-9A-z]*)"/g
    const episodesIds = []
    while(r = regexEpisodesIds.exec(html))
      episodesIds.push(r[1])
    return { titleId: regexTitleId.exec(html)?.[2], episodesIds }
  }

  const getAuthToken = () => JSON.parse(localStorage.getItem('jw/user') || '{}')?.accessToken

  const createWatchedPayload = (justWatchId) => ({
    "operationName": "SetInSeenlist",
    "variables": {
      "platform": "WEB",
      "input": {
        "id": justWatchId,
        "state": true,
        "country": "US"
      },
      "country": "US",
      "language": "en",
      "watchNowFilter": {},
      "includeUnreleasedEpisodes": false
    },
    "query": "mutation SetInSeenlist($input: SetInSeenlistInput!, $country: Country!, $language: Language!, $includeUnreleasedEpisodes: Boolean!, $watchNowFilter: WatchNowOfferFilter!, $platform: Platform! = WEB) {\n  setInSeenlist(input: $input) {\n    title {\n      id\n      ... on Movie {\n        seenlistEntry {\n          createdAt\n          __typename\n        }\n        watchlistEntry {\n          createdAt\n          __typename\n        }\n        __typename\n      }\n      ... on Show {\n        seenState(country: $country) {\n          progress\n          caughtUp\n          __typename\n        }\n        seasons {\n          id\n          seenState(country: $country) {\n            progress\n            __typename\n          }\n          episodes {\n            id\n            seenlistEntry {\n              createdAt\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      ... on Season {\n        show {\n          id\n          seenState(country: $country) {\n            progress\n            caughtUp\n            __typename\n          }\n          __typename\n        }\n        episodes {\n          id\n          seenlistEntry {\n            createdAt\n            __typename\n          }\n          __typename\n        }\n        seenState(country: $country) {\n          progress\n          caughtUp\n          __typename\n        }\n        __typename\n      }\n      ... on Episode {\n        seenlistEntry {\n          createdAt\n          __typename\n        }\n        show {\n          id\n          objectId\n          seenState(country: $country) {\n            progress\n            caughtUp\n            __typename\n          }\n          watchNextEpisode(\n            country: $country\n            includeUnreleasedEpisodes: $includeUnreleasedEpisodes\n          ) {\n            id\n            objectId\n            objectType\n            offerCount(country: $country, platform: $platform)\n            season {\n              content(country: $country, language: $language) {\n                fullPath\n                __typename\n              }\n              seenState(country: $country) {\n                releasedEpisodeCount\n                seenEpisodeCount\n                progress\n                __typename\n              }\n              __typename\n            }\n            content(country: $country, language: $language) {\n              title\n              episodeNumber\n              seasonNumber\n              upcomingReleases(releaseTypes: [DIGITAL]) @include(if: $includeUnreleasedEpisodes) {\n                releaseDate\n                label\n                __typename\n              }\n              __typename\n            }\n            watchNowOffer(country: $country, platform: $platform, filter: $watchNowFilter) {\n              id\n              standardWebURL\n              package {\n                packageId\n                clearName\n                __typename\n              }\n              retailPrice(language: $language)\n              presentationType\n              monetizationType\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  })

  const createLikedPayload = (justWatchId) => ({
    "operationName": "SetInLikelist",
    "variables": {
      "input": {
        "id": justWatchId,
        "state": true
      }
    },
    "query": "mutation SetInLikelist($input: SetInTitleListInput!) {\n  setInLikelist(input: $input) {\n    title {\n      id\n      likelistEntry {\n        createdAt\n        __typename\n      }\n      dislikelistEntry {\n        createdAt\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  })

  const createDislikedPayload = (justWatchId) => ({
    "operationName": "SetInDislikelist",
    "variables": {
      "input": {
        "id": justWatchId,
        "state": true
      }
    },
    "query": "mutation SetInDislikelist($input: SetInTitleListInput!) {\n  setInDislikelist(input: $input) {\n    title {\n      id\n      dislikelistEntry {\n        createdAt\n        __typename\n      }\n      likelistEntry {\n        createdAt\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  })

  async function justWatchApiPost(payload) {
    const response = await fetch(`https://apis.justwatch.com/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(payload)
    })
    if (response.status != 200)
      console.error('Error posting to Just Watch API:', await response.text(), payload)
  }

  async function setAsWatched(justWatchId) {
    const payload = createWatchedPayload(justWatchId)
    await justWatchApiPost(payload)
  }

  async function setAsLiked(justWatchId) {
    const payload = createLikedPayload(justWatchId)
    await justWatchApiPost(payload)
  }

  async function setAsDisliked(justWatchId) {
    const payload = createDislikedPayload(justWatchId)
    await justWatchApiPost(payload)
  }

  async function importTitle(justWatchLink, liked, lastEpisodeWatched) {
    const { titleId, episodesIds } = await getJustWatchIds(justWatchLink)
    if (!titleId)
      throw new Error(`No JustWatch id found for ${justWatchLink}`)

    if (liked === true)
      await setAsLiked(titleId)
    else if (liked === false)
      await setAsDisliked(titleId)

    if (lastEpisodeWatched) {
      if (episodesIds?.length) {
        for (let i = 0; i < episodesIds.length && i < lastEpisodeWatched; i++)
          await setAsWatched(episodesIds[i])
      } else
        await setAsWatched(titleId)
    }
  }

  async function importTitleFromTraktTv(traktTvLink, liked = null, lastEpisodeWatched = null) {
    const justWatchLink = await getJustWatchLink(traktTvLink)
    if (!justWatchLink)
      throw new Error(`No JustWatch link found for ${traktTvLink}`)
    await importTitle(justWatchLink, liked, lastEpisodeWatched)
  }

  async function importRatingsFromTraktTv(ratingsList, likedIfGreaterThan = 5) {
    if (!Array.isArray(ratingsList))
      throw new Error('Ratings list must be an array')

    for (let i = ratingsList.length - 1; i >= 0; i--) {
      try {
        const rating = ratingsList[i]
        let title = 'Title Unknown'
        if (rating.type == 'movie') {
          title = rating.movie.title
          await importTitleFromTraktTv(`https://trakt.tv/movies/${rating.movie.ids.slug}`, rating.rating > likedIfGreaterThan, 1)
          console.log(`${i} - Done rating ${title}`)
        }
        else if (rating.type == 'show') {
          title = rating.show.title
          await importTitleFromTraktTv(`https://trakt.tv/shows/${rating.show.ids.slug}`, rating.rating > likedIfGreaterThan)
          console.log(`${i} - Done rating ${title}`)
        }
        else {
          throw new Error(`Unknown rating type: ${rating.type} (Just Watch doesn't support ratings for seasons and episodes)`)
        }
      } catch (e) {
        console.error(`${i} - Error rating ${title}`, e)
      }
    }
  }

  async function importWatchedShowsFromTraktTv(watchedShowsList) {
    if (!Array.isArray(watchedShowsList))
      throw new Error('Watched shows list must be an array')

    for (let i = watchedShowsList.length - 1; i >= 0; i--) {
      const watchEvent = watchedShowsList[i]
      let title = 'Title Unknown'
      for (let season of watchEvent.seasons) {
        try {
          title = watchEvent.show.title
          await importTitleFromTraktTv(`https://trakt.tv/shows/${watchEvent.show.ids.slug}/seasons/${season.number}`, null, season.episodes.length)
          console.log(`${i} - Done setting as watched ${title} S${season.number}`)
        } catch (e) {
          console.error(`${i} - Error setting as watched ${title}`, e)
        }
      }
    }
  }

  async function loadZipLib() {
    return await new Promise(async (resolve, reject) => {
      if (JSZip)
        return resolve()

      const script = document.createElement('script')
      script.setAttribute('type', 'text/javascript')
      // Cannot just set the source, because github returns file type as text/plain
      const r = await fetch('https://raw.githubusercontent.com/Stuk/jszip/main/dist/jszip.min.js')
      script.innerHTML = await r.text()
      script.addEventListener('load', resolve)
      script.addEventListener('error', () => reject('Error loading zip.js'))
      document.getElementsByTagName('head')[0].appendChild(script)
    })
  }

  async function exportTraktTvData(username) {
    await loadZipLib()
    const response = await fetch(`https://darekkay.com/service/trakt/trakt.php?username=${username}`)
    const blob = await response.blob()
    const zip = await JSZip.loadAsync(blob)
    const ratingsMovies = JSON.parse(await zip.file('ratings_movies.txt').async('string'))
    const ratingsShows = JSON.parse(await zip.file('ratings_shows.txt').async('string'))
    const watchedShows = JSON.parse(await zip.file('watched_shows.txt').async('string'))
    console.log('Downloaded your Trakt.tv data')
    return { ratings: [ ...ratingsMovies, ...ratingsShows], watchedShows }
  }

  async function traktTvToJustWatch(username, likedIfGreaterThan = 5) {
    const userData = await exportTraktTvData(username)
    await importRatingsFromTraktTv(userData.ratings, likedIfGreaterThan)
    await importWatchedShowsFromTraktTv(userData.watchedShows)
  }

  window.traktTvToJustWatch = traktTvToJustWatch;
})()