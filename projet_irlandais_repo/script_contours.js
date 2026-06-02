const largeur = 900;
const hauteur = 700;
const marges = 25;

const svg = d3
.select("body")
.append("svg")
.attr("width", largeur)
.attr("height", hauteur)
.style("border", "1px solid black");

const contours = svg.append("g");
const frontieres = svg.append("g");

d3.json("data/ireland_counties.geojson").then(function(donneesGeo)
{
    d3.csv("data/F8002.20260507T100546.csv").then(function(donneesCSV)
    {
        dessiner(donneesGeo, donneesCSV);
    });
});

function dessiner(donneesGeo, donneesCSV)
{
    const donnees = donneesCSV.filter(function(d)
    {
        return d["Census Year"] == "2022"
        && d["Sex"] == "Both sexes"
        && d["Statistic Label"].toLowerCase().indexOf("irish speakers as a percentage of total") != -1;
    });

    donnees.forEach(function(d)
    {
        donneesGeo.features.forEach(function(f)
        {
            if(normaliser(f.properties.name) == normaliser(d["County of Usual Residence"]))
            {
                f.properties.valeur = +d["VALUE"];
            }
        });
    });

    const projection = d3.geoMercator().fitSize([largeur, hauteur], donneesGeo);
    const pathGenerator = d3.geoPath().projection(projection);

    const grille = [];

    for(let x = 0; x < largeur; x = x + 8)
    {
        for(let y = 0; y < hauteur; y = y + 8)
        {
            const point = projection.invert([x, y]);

            if(point)
            {
                donneesGeo.features.forEach(function(f)
                {
                    if(d3.geoContains(f, point) && f.properties.valeur != undefined)
                    {
                        grille.push({
                            x: x,
                            y: y,
                            poids: f.properties.valeur
                        });
                    }
                });
            }
        }
    }

    const generateurContours = d3.contourDensity()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .weight(function(d) { return d.poids; })
    .size([largeur, hauteur])
    .bandwidth(25)
    .thresholds(12);

    const niveaux = generateurContours(grille);

    const couleur = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([
        d3.min(niveaux, function(d) { return d.value; }),
        d3.max(niveaux, function(d) { return d.value; })
    ]);

    contours
    .selectAll("path")
    .data(niveaux)
    .enter()
    .append("path")
    .attr("d", d3.geoPath())
    .attr("fill", function(d) { return couleur(d.value); })
    .attr("stroke", "none")
    .style("opacity", 0.8);

    frontieres
    .selectAll("path")
    .data(donneesGeo.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1.2);
}

function normaliser(texte)
{
    return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .trim();
}
