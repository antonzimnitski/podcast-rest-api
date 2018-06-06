const mongoose = require("mongoose");
const axios = require("axios");
const { find, filter } = require("lodash");
const X2JS = require("x2js");
const getPodcastFeedUrl = require("./../helpers/getPodcastFeedUrl");

module.exports = async podcastId => {
  return await getData(podcastId);
};

async function getData(podcastId) {
  const feedUrl = await getPodcastFeedUrl(podcastId);
  const json = await parseFeed(feedUrl);
  return {
    podcastId,
    feedUrl,
    title: getTitle(json),
    author: getAuthor(json),
    website: getWebsite(json),
    description: getDescription(json),
    summary: getSummary(json),
    artwork: getArtwork(json),
    episodes: getEpisodes(json)
  };
}

function parseFeed(feedUrl) {
  return axios(feedUrl)
    .then(res => xml2json(res.data))
    .then(res => res.rss.channel)
    .catch(err => console.log("Error in parseFeed", err));
}

function xml2json(xml) {
  const x2js = new X2JS();
  return x2js.xml2js(xml);
}

function getTitle(data) {
  return data.title;
}

function getAuthor(data) {
  return data.author.toString();
}

function getWebsite(data) {
  return getStringfromArray(data.link);
}

function getDescription(data) {
  return getStringfromArray(data.description);
}

function getSummary(data) {
  return data.summary.toString();
}

function getEpisodes(data) {
  return data.item.map(episode => {
    try {
      return {
        title: getStringfromArray(episode.title),
        description: getDescription(episode),
        mediaUrl: getMediaUrl(episode),
        pubDate: getPubDate(episode),
        linkToEpisode: getLinkToEpisode(episode)
      };
    } catch (error) {
      console.log(episode);
    }
  });
}

function getMediaUrl(data) {
  return data.enclosure["_url"];
}

function getPubDate(data) {
  return data.pubDate;
}

function getLinkToEpisode(data) {
  return data.link;
}

function getArtwork(data) {
  const imgObj = Array.isArray(data.image) ? data.image : [data.image];
  const result = find(
    imgObj,
    o => o.hasOwnProperty("_href") || o.hasOwnProperty("url")
  );
  return result["url"] || result["_href"];
}

/*
"title": [
  "SYSK Selects: Was there a real King Arthur?",
  {
      "__prefix": "itunes",
      "__text": "SYSK Selects: Was there a real King Arthur?"
  }
]*/
function getStringfromArray(array) {
  if (typeof array === "string") return array;
  if (Array.isArray(array)) {
    const res = array.filter(el => {
      if (typeof el === "string") return el;
    });

    return res.length > 1 ? res[0] : res.toString();
  }
}