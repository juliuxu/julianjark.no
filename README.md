# [julianjark.no](https://julianjark.no/)

My personal website

```mermaid
flowchart TD

Landing --> Drinker
Landing --> Presentasjoner
Landing --> NotionDrivenPages

subgraph NotionDrivenPages
  direction TB
  om-meg[Om meg]
  Mat
  CV[CV / Portofolje]
  TIL[Today I Learned / Tidbits / Knowledge]

end
```

## Development and Production mode

For development:

```sh
npm run dev
```

Build app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```
