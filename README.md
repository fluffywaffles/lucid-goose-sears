# Sears Admin Application

## Get started

`npm i && gulp serve`

Can:

  1. Upload photos (AWS S3)
  2. Select some number of photos to be "featured" (max 5?)
  3. Easily change between featured/non-featured

## Backend Architecture

  - NODE_ENV credentials for S3
    - AWS_KEY
    - AWS_SECRET
    - These variables must be set in order to access S3
    - For local development, can use a .env file in the root directory of the application folder
  - S3 bucket for photos
  - On-disk cache of "featured" photos (LevelDB)
    - NOT supported by certain dynamic hosts, eg Heroku
    - Double check this
  - GET /photos => S3.listObjects
  - GET /photos/featured => cache.get('featured')
  - PUT /photos => S3.upload
  - PUT /photos/featured => cache.put('featured', ...)

## Front-End

  - Photo listing
    - See design doc sketch mockup
  - "Featured" section
  - Easily feature/unfeature a photo
  - Easily upload a new photo
  - That's it

### Front-End Architecture

  - Vanilla JS
    - qwest for API calls
    - that's probably all you need
  - Pre-rendered jade, stylus
  - `gulp build`
  - `gulp serve`
  - Build, then serve
  - Use express.static(...) to put up the front-end
  - All 1 server (that was confusing last time I think)
