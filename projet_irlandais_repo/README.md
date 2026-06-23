# Mapping Irish Speakers in Ireland: A County-Level Choropleth from Census 2022

## 1. Project overview

Irish is difficult to map without making it look simpler than it actually is. A county can be coloured, a percentage can be displayed, and a legend can make the distribution immediately readable, but the language itself does not live only inside those administrative shapes. It moves through schools, families, cities, Gaeltacht districts, symbolic attachments, partial competence, daily use, and local communities whose relation to Irish is not always captured by a single census category.

This project starts from that difficulty. It uses Census 2022 data to produce a county-level choropleth map of Irish speakers as a percentage of the total population. Its primary object is therefore not the Irish language as a whole, but one precise statistical variable: the percentage of people recorded in the census as Irish speakers in each county-level unit. The map translates that variable into colour, while the side panel gives a second level of reading by showing a short ability breakdown for the selected county.

The project is therefore positioned between a linguistic question and a visual one. From the linguistic side, Irish cannot be reduced to one national layer. From the visual side, the map cannot display everything at once. It has to select, filter, simplify, and explain. The purpose of this README is to make those operations visible: where the data came from, how they were prepared, why this visual form was chosen, and where the limits of the map remain.

## 2. Final visualisation

[Irish language in Ireland.pdf](https://github.com/user-attachments/files/29258932/Irish.language.in.Ireland.pdf)

*Figure 1. Final interface of the county-level choropleth map, showing Irish speakers as a percentage of the total population by county-level unit.*

## 3. How to run the project

The project should be served through a local Python server. It should not be opened directly with `file://`, because the CSV and GeoJSON files are loaded dynamically by D3.

From the local project folder, run:

```bash
cd "/Users/arvendobay/Desktop/Documents/Documents 2026/UNINE/MA/Printemps 2026/Visualisation de données/projet_irlandais_repo"
python3 -m http.server 8030
```

Then open:

```text
http://localhost:8030/index.html?v=7
```

The version suffix is used to reduce browser-cache problems during development. The script also loads the data files with version suffixes.

## 4. Project files

```text
projet_irlandais_repo/
├── index.html
├── style.css
├── script.js
├── README.md
├── figures/
│   └── irish_language_map.png
└── data/
    ├── F8002.20260619T220645.csv
    ├── F8015.20260507T100507.csv
    └── ireland_counties.geojson
```

The file `index.html` contains the structure of the web page, including the title, explanatory text, map container, side panel and script imports. The file `style.css` controls the visual layout of the page, especially the relation between the map and the county detail panel. The file `script.js` contains the D3 logic: loading the files, filtering the rows, matching the county names, drawing the SVG paths, applying the colour scale, handling hover and click interactions, and updating the panel when the user selects a county.

## 5. Data sources

The primary sources of the project are the files from which the map is built. This distinction is important since the map does not begin as an image. It begins as a relation between two kinds of material: a statistical table and a geographic file. The statistical table gives the values to be represented. The geographic file gives the shapes onto which those values can be placed. The visualisation is therefore produced by making these two sources correspond.
The main statistical source is the Central Statistics Office’s Census of Population 2022 Profile 8 - The Irish Language and Education. From that source, the project uses two downloaded comma-separated values files.

The first file is:

```text
data/F8002.20260619T220645.csv
```

This file is the main source for the colour of the map. It contains the county-level variable used in the choropleth: Irish speakers as a percentage of the total population. In the script, the table is filtered so that only the relevant rows are retained:

```text
Census Year = 2022
Sex = Both sexes
Statistic Label = Irish speakers as a percentage of total
County of Usual Residence != State
```

This filtering step is necessary because the file contains more information than the map needs. The map requires one main percentage value per county-level unit, not the whole table.

The second file is:

```text
data/F8015.20260507T100507.csv
```

This file is used for the side panel that appears when a county is selected. It provides a more detailed breakdown of Irish-language ability for the selected area. The script keeps the rows corresponding to:

```text
Census Year = 2022
Sex = Both sexes
Age Group = All ages
Frequency of speaking Irish = All Irish speakers
```

The panel then groups the values into a short ability breakdown:

```text
Total
Very well
Well
Not well
not stated
```

The geographic source is:

```text
data/ireland_counties.geojson
```

This file provides the county and city shapes drawn on the map. It does not contain the percentage of Irish speakers. The percentages are attached later by the script, after the names in the geographic file have been matched with the names in the census table. This is one of the central operations of the project. The map is not simply loaded. It is assembled.

## 6. Historical and linguistic background

The map begins with contemporary census data, but the variable it displays belongs to a much longer history. Irish is not simply a language that declined and then survived in a few residual areas. That would make the present map too easy to read. What the map shows is a present distribution, but that distribution has been shaped by older historical pressures, by the changing status of Irish in law and education, by the uneven geography of the Gaeltacht, and by the more recent movement of Irish into urban and institutional networks.

For the contemporary map, the most important point is really centered around the unevenness of its present social geography. Mac Giolla Chríost describes it as diffuse, both through Irish-speaking networks across Ireland and through fragmented communities dispersed across the Gaeltacht (Mac Giolla Chríost 2005:199). He also shows that the Gaeltacht cannot be sustained as a homogeneous and territorially coherent linguistic entity, since census data show both daily Irish use within the Gaeltacht and significant Irish-speaking populations outside it, including in cities (Mac Giolla Chríost 2005:200-203).

The Comprehensive Linguistic Study of the Use of Irish in the Gaeltacht reinforces the same caution. The study was commissioned because language use in the contemporary Gaeltacht required up-to-date data and analysis, and because census information, statutory boundaries and community realities could not simply be treated as the same thing (Ó Giollagáin et al. 2007:3). The report also explains that the statutory Gaeltacht contains areas where the majority of inhabitants are active Irish speakers, but also other areas included for language-support and preservation purposes, without a mechanism clearly differentiating all the language-community types included within those boundaries (Ó Giollagáin et al. 2007:8-9). This is why the county-level map cannot be read as a direct map of Gaeltacht vitality.

The same caution also applies inside the category Irish speakers itself. The map cannot show whether the Irish reported by respondents belongs mainly to school-based competence, habitual community use, regional Gaeltacht norms, local linguistic practice, or relation to the official written standard. Standardisation matters here not because the map can represent it, but because it reminds us that Irish-speaking ability is not a single social situation. The visualisation therefore has to keep the census category stable while acknowledging what that category cannot separate.

## 7. Methodology

The methodology of this project is built around a simple problem: how to join the data and the map. The census file contains rows, labels, years, categories and values. The GeoJSON file contains shapes. The map only becomes possible when one value from the census table can be attached to one geographic unit. In that sense, the work was not only to draw a map, but to make the table and the territory correspond in a controlled way.

The first step was to select the mapped variable. The CSO file contains more information than the map can use at once, so the table had to be filtered. I kept only the rows where the census year is 2022, the sex category is both sexes, and the statistic is Irish speakers as a percentage of total. This produces one main percentage value for each county-level unit. The State-level row was excluded, because it does not correspond to a county shape on the map. This step is important because the map needs a stable observational unit. Here, the unit is not the individual speaker, nor the Gaeltacht district, nor the household, but the county-level statistical unit given in the census table.

The second step was to load the geographic file. The GeoJSON file gives the visible outlines of the counties and city areas. It does not contain the Irish-language percentages. This means that the geographic file cannot by itself answer the research question. It only gives the spatial frame into which the census values can be inserted.

This join was not completely automatic. Some names in the census table and in the geographic file do not appear in exactly the same form. The script therefore normalises names before comparing them. It removes differences that are not meaningful for the match, such as capitalisation, accents, hyphens and some punctuation. The normalisation step does not change the data value itself. It only makes it possible to identify that two labels refer to the same place.

The third step was to check the cases where the geographic outline and the census unit do not fully coincide. This was the most important correction made to the project. Cork City and Cork County are drawn as separate shapes on the map, but the census percentage is given for them together. The same logic applies to Limerick City and County, and to Waterford City and County. Tipperary also needed explicit treatment, because North and South Tipperary appear as separate visible shapes, while the census value is read as a pooled unit.

For that reason, the script creates a statistical key for each visible shape:

```text
Cork City + Cork County -> cork
Limerick City + Limerick County -> limerick
Waterford City + Waterford County -> waterford
North Tipperary + South Tipperary -> tipperary
```

The colour and the panel then follow this statistical key rather than the visible shape alone. When one part of a combined unit is selected, the panel gives the combined value, and the explanatory note states why the unit has been gathered in this way.

The fourth step was to reduce the information shown in the side panel. The first working version displayed too many raw rows from the detail CSV file. It was not wrong in the sense that the rows came from the data, but it made the interface difficult to read. I therefore kept only the rows needed for a short ability breakdown: total, very well, well, not well, and not stated. This keeps the panel close to the source table while preventing it from becoming a second spreadsheet next to the map.

The methodology is therefore not only technical. It is interpretive in a limited but important sense. Each correction was made to keep the visualisation aligned with the structure of the dataset. The map shows county-level census percentages, and nothing more precise than that. The side panel adds detail, but it also follows the census unit. This keeps the project readable while avoiding the main risk of the map: allowing a boundary line or a colour to say more than the data can actually support.

## 8. Visualisation design

The final visualisation is a county-level choropleth map. This choice comes directly from the data. The main table gives one percentage for each county-level unit, so the map gives one colour to each corresponding area. A smoother map would have been visually attractive, but it would also have made the data appear more spatially precise than they are. The final version therefore keeps the county as the main unit of representation.

The scale is sequential because the selected variable is quantitative. The values do not form unrelated classes. They form an ordered range, from lower to higher percentages of Irish speakers. This is why I did not use separate categorical colours. The map is not asking the reader to distinguish arbitrary groups. It asks the reader to see variation along one continuous measure.

The county borders remain visible, but they are kept visually secondary. They are needed because the data are attached to territorial units. Without them, the reader would not know which area is being interpreted. At the same time, the border should not become more important than the value. This was also one of the reasons for keeping the final map relatively simple. The project is not trying to make the most spectacular possible image. It is trying to make the selected census variable legible.

Krum's study is helpful since the final interface depends on keeping the whole reading situation visible. A reader should be normally able to see the map, the legend and the selected-county panel without losing the relation between them. Krum argues that data visualisation can make comparison easier when the relevant information is placed in the same field of view and can be understood quickly (Krum 2014:4). In this project, that principle explains why the side panel is placed beside the map rather than separated from it.

The side panel was added because the map alone would make the colour too self-sufficient. When a county is clicked, the panel gives the main percentage and a short ability breakdown. This creates two levels of reading. The map first gives the general distribution. The panel then returns the viewer to the census categories behind the selected area. The panel was also kept deliberately short, because adding every possible row from the CSV file would have made the interface closer to a spreadsheet than to a readable visualisation.

Krum also makes the question of source transparency important for this project. A visualisation becomes more credible when it makes its data sources and design process clear, rather than leaving the viewer to trust the final image without seeing how it was produced (Krum 2014:295). This is one reason why the README gives the file names, the filters, the matching logic and the special geographic cases explicitly.

The hover effect is now based on opacity. This helpfully avoids the problem created by moving SVG paths above one another during hover. The interaction therefore remains stable: hovering gives visual feedback, and clicking still selects the county correctly.

## 9. Reading the map

The map should be read first as a general distribution, not as a complete account of Irish in Ireland. Its colour scale shows the percentage of Irish speakers in each county-level unit, with lower values and higher values placed along the same ordered scale. The first reading is therefore deliberately simple: where does the census percentage appear stronger, and where does it appear weaker?

The combined units are also part of the reading of the map. Cork City and Cork County are drawn as separate shapes, but the census percentage is given for them together. The same logic applies to Limerick City and Limerick County, and to Waterford City and Waterford County. Tipperary is shown as Tipperary (North and South). In these cases, the visible boundary and the statistical unit do not fully coincide. The panel therefore makes the statistical unit explicit instead of allowing the boundary line to create a false impression of separate values.

This correction matters because the map is not only a visual object. It is also an argument about how the dataset has been interpreted. If a shape is coloured, the reader assumes that the colour belongs to that shape. If two shapes share one census value, that relationship has to be made visible. The final version of the map therefore keeps the geographic outlines, but makes the panel follow the unit actually used by the data.

## 10. Limits

The limits of the project come directly from the data itself. Asking whether a person can speak Irish is not the same as asking whether Irish is used every day, whether it is spoken at home, whether it is the person’s strongest language, or whether it functions as the language of a local community. The map therefore visualises declared ability, not the whole social life of the language.

The county scale creates a second limit. A county is useful because it gives a stable unit for mapping, but it remains linguistically coarse. It can show a broad spatial distribution, but it can also hide important linguistic information, and may even look more precise than it really is. This is especially important for Irish, because the geography of the language is not simply county-shaped. A county-level map can show broad variation, but it cannot show finer networks, local densities, household transmission or community-level patterns.

The same caution applies to the Gaeltacht. The map does not map the Gaeltacht as such. It maps county-level census percentages. The Comprehensive Linguistic Study of the Use of Irish in the Gaeltacht shows why this distinction matters, since the statutory Gaeltacht itself contains different kinds of language communities and cannot be treated as one homogeneous linguistic space (Ó Giollagáin et al. 2007:8-10). This project therefore cannot infer Gaeltacht vitality from county colour alone.

Finally, the visualisation is limited by its own clarity. A good map must simplify. It must select one value, one scale, one visual form and one reading path. This is what makes it readable, but it is also what prevents it from being complete. The project should therefore be read as a controlled visual entry into the CSO dataset. Its strength lies in making one variable visible. Its limit lies in everything that this one variable cannot say.

## 11. Generative AI declaration

Generative AI was used as a support tool during the project, mainly to help with debugging and with HTML, CSS and D3 code, which were more unfamiliar to me. AI assistance was useful in correcting specific technical problems, especially the D3 layout, the click interaction, the hover behaviour, and the matching between county names in the CSV and GeoJSON files. These generated or assisted code sections were tested locally and adjusted during the project. They do not represent the majority of the work.

## 12. Sources

Central Statistics Office Ireland. *Census of Population 2022 Profile 8 - The Irish Language and Education*.

Krum, Randy. *Cool Infographics: Effective Communication with Data Visualization and Design*. Indianapolis, IN: John Wiley & Sons, 2014.

Mac Giolla Chríost, Diarmait. *Irish in a Global Age*. 2005.

Ó Giollagáin, Conchúr, Seosamh Mac Donnacha, Fiona Ní Chualáin, Aoife Ní Shéaghdha, and Mary O’Brien. *Comprehensive Linguistic Study of the Use of Irish in the Gaeltacht: Principal Findings and Recommendations*. Dublin: The Stationery Office, 2007.


