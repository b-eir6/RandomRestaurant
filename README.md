
# RandomRestaurant

Identifies a random restaurant within the target radius to aid users on quickly choosing a place to eat.

![Sample Usage](https://github.com/b-eir6/RandomRestaurant/blob/main/SampleUsage.gif)
## Getting Started

In order to run this app, you will first need to generate your own personal API key from the Google Maps platform [here](https://www.google.com/search?q=google+maps+api+getting+started&rlz=1C1GCEU_enNZ922NZ922&oq=google+maps+api+getting&aqs=chrome.0.69i59j69i57j35i39l2j0i512j69i60l3.3280j0j7&sourceid=chrome&ie=UTF-8).

Once you have obtained this key, you will need to paste it in `index.html` at location `YOUR_API_KEY`

Currently this app requires geolocation permissions on your browser to work.
## Run Locally

Clone the project

```bash
  git clone https://github.com/b-eir6/RandomRestaurant.git
```

Go to the project directory

```bash
  cd RandomRestaurant
```

Install dependencies

```bash
  npm install
```

Compile typescript
```bash
  tsc
```

Finally, launch `index.html`
## Features
- Keyword input
- Radius range slider
## To Do
- [ ]   Allow user to select a center location
- [ ]   Compatible on mobile
