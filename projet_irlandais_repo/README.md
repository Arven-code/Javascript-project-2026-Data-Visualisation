# Irish language in Ireland

This repository contains the current working version of my project for the course *Visualisation de données*.

The project is based on Census 2022 data from the Central Statistics Office (Ireland), and focuses on the spatial distribution of Irish speakers in Ireland.

## Current state of the project

At this stage, the project contains a first functional version of the map in D3:
- the Ireland county GeoJSON loads correctly
- the census data are linked to the map
- a first county-based coloured visualisation works
- a first experimental contour version is also included separately

The main working version currently used is in `script.js`.

The experimental contour version is in `script_contours.js`.

## Data sources

The project uses the following files:

- `F8002.20260507T100546.csv`
- `F8015.20260507T100507.csv`
- `ireland_counties.geojson`

The CSV files come from the Central Statistics Office, Ireland, Census 2022, Profile 8: *The Irish Language and Education*.

## Data presentation

### F8002
This table gives the percentage of Irish speakers and non-Irish speakers aged 3 years and over, by county/city.

For the current map, I keep:
- Census Year = 2022
- Sex = Both sexes
- Statistic Label = Irish speakers as a percentage of total

### F8015
This table gives information about Irish speakers aged 3 years and over, by age group, sex, administrative county, frequency of speaking Irish, and level of Irish spoken.

For the current detail panel, I keep:
- Census Year = 2022
- Sex = Both sexes
- Age Group = All ages

## Pre-processing

The main pre-processing steps in this work were:
- filtering the CSV tables to keep only the relevant 2022 rows
- converting the percentage values into actual numeric values
- normalising the county names in order to match the CSV files with the GeoJSON file
- attaching the values from `F8002` to the county polygons in the GeoJSON

## Visualisation
The current main visualisation is a county map of Ireland coloured according to the proportion of Irish speakers.

## AI use declaration

I used generative AI as assistance for part of the technical debugging, repository structuring and some code drafting. These generated parts were then reworked, tested, corrected, and integrated into my own project. They do not represent the majority of the work.
