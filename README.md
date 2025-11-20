# eIF4E Genomic Atlas

A comprehensive genomic and structural atlas for **eIF4E** (Eukaryotic Translation Initiation Factor 4E), featuring mutation data, structural insights, and cross-species analysis.

![eIF4E Atlas Preview](assets/preview.png)

## Features

-   **Centralized Search**: Search by Protein Name, Species (e.g., "Human"), or UniProt ID (e.g., "P06730").
-   **Real-time Data**: Fetches live data directly from the [UniProt API](https://www.uniprot.org/).
-   **Interactive Visualization**:
    -   Dynamic result cards.
    -   **Mutation Landscape**: Bar charts visualizing mutation distribution across the protein sequence.
    -   Detailed modal views with genomic and structural info.
-   **Responsive Design**: Works seamlessly on desktop and mobile.

## Tech Stack

-   **Frontend**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript (ES6+).
-   **Libraries**: [Chart.js](https://www.chartjs.org/) for data visualization.
-   **API**: [UniProtKB REST API](https://www.uniprot.org/help/api).
-   **Deployment**: GitHub Pages (Client-side only).

## Setup & Deployment

This project is designed to be hosted on **GitHub Pages**.

### Local Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/madsondeluna/eif4e-atlas.git
    ```
2.  Open `index.html` in your browser.

### Deploying to GitHub Pages

1.  Push the code to your GitHub repository.
2.  Go to **Settings** > **Pages**.
3.  Under **Source**, select `Deploy from a branch`.
4.  Select `main` (or `master`) branch and `/ (root)` folder.
5.  Click **Save**.
6.  Your site will be live at: `https://madsondeluna.github.io/eif4e-atlas/`

## License

MIT
