# cosmosmillions-rescue
#### dApp to withdraw from cosmosmillions on lum network - https://pro.osmosis.zone/
#### 👉 **[click here to use the dApp](https://jasbanza.github.io/cosmosmillions-rescue/)**
_📌 don't forget to bookmark!_
### Features:
- Pull list of connected wallet's deposits
- Withdraw specific deposits
- ✅ Keplr
- ✅ Ledger
## Custom Hosting:
Everything in the ./dist folder is ready to be hosted on a web server. Simply copy and paste and it should work.
## Development Setup
#### Install project and dev dependencies:
```bash
npm install
```
#### For development:
```bash
npm run dev
```
- Deploys a localhost HTTP server ()
- Monitors JS, CSS & HTML and bundles changes (outputs to ./preview which is included in .gitignore)
#### Compile:
```bash
npm run compile
```
- Bundles js for browser, outputs to:
- ./dist (included in .gitignore)
- ./docs (use for github pages)

## Deployment Setup
First-time deployment requires installing gh-pages:
```bash
npm install gh-pages --save-dev
```

Update package.json scripts:
```json
"scripts": {
  "predeploy": "npm run compile",
  "deploy": "gh-pages -d docs",
  "start": "react-scripts start",
  "build": "react-scripts build"
}
```

Set homepage in package.json:
```json
{
  "homepage": "https://jasbanza.github.io/cosmosmillions-rescue",
  ...
}
```

Deploy to GitHub Pages:
```bash
npm run deploy
```

Configure GitHub Pages:
1. Go to repository Settings → Pages
2. Select branch: gh-pages
3. Save changes

Your dApp will be live at https://jasbanza.github.io/cosmosmillions-rescue

```mermaid
flowchart TD
    subgraph "Build Process"
        direction TB
        Clean["Clean Phase"] --> Parallel["Parallel Build"]
        
        subgraph "Parallel Tasks"
            direction TB
            HTML["HTML Build"]
            JS["JS Bundle"]
            SW["Service Worker"]
            CSS["CSS Build"]
            IMG["Images"]
            JSON["JSON"]
        end
        
        Parallel --> Deploy["Deploy Phase"]
        
        subgraph "Deployment"
            direction TB
            Dist["dist/"]
            Docs["docs/"]
        end
    end
    
    subgraph "Development"
        direction TB
        DevClean["Clean Preview"] --> DevBuild["Dev Build"]
        DevBuild --> DevServe["Development Server"]
        
        subgraph "Watchers"
            direction TB
            HTMLW["HTML Watch"]
            JSW["JS Watch"]
            CSSW["CSS Watch"]
        end
        
        DevServe --> Watchers
    end
    
    classDef phase fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef task fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef deploy fill:#f1f8e9,stroke:#33691e,stroke-width:2px,color:#000
    
    class Clean,Parallel,Deploy phase
    class HTML,JS,SW,CSS,IMG,JSON,DevClean,DevBuild,DevServe task
    class Dist,Docs deploy
```

```mermaid
graph TD
    subgraph Local["Custom CI/CD Pipeline"]
        direction TB
        Source["Source Code<br/><i>main branch</i>"]
        Build["Build Process<br/><code>npm run compile</code>"]
        Dist["dist/<br/><i>built files</i>"]
        Docs["docs/<br/><i>GitHub Pages files</i>"]
    end
    
    subgraph Remote["Remote Repository"]
        direction TB
        Main["main branch<br/><i>source code</i>"]
        GHPages["gh-pages branch<br/><i>built app</i>"]
    end
    
    Source --> Build
    Build --> Dist
    Build --> Docs
    Source -->|"git push"| Main
    Docs -->|"gh-pages deploy"| GHPages
    GHPages -->|"GitHub Pages"| Live["Live Site<br/><i>jasbanza.github.io/cosmosmillions-rescue</i>"]

    classDef local fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef remote fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef site fill:#f1f8e9,stroke:#33691e,stroke-width:2px,color:#000
    
    class Source,Build,Dist,Docs local
    class Main,GHPages remote
    class Live site
```