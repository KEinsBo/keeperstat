# Keeperstat

## Problem to Solve
When playing Handball on a non amateur level, Goalkeepers have no stats whatsoever. Only the Players get their credits and etc. This is why I decided to make this project to have a way for viewers to track the stats of their favourite goalkeepers.

## The Implementation
The Project is written in Typescript using Angular und scss.
The Site is hosted on Netlify at the domain https://keeperstat.netlify.app.
All of the users Data is cached in their browser and they have the Option to export it.
### Local storage json format:

```
{
  "games": [
    {
      "date":"YYYY-MM-DD",
      "actions": [
        {
          "index": 0,
          "team": 0,
          "type": "save",
          "position":[0, 0],
          "7m": true
        },
        {
          "index": 1,
          "team": 1,
          "type": "miss",
          "position":null,
          "7m": false
        }
      ] 
    }
  ]
}
```

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

