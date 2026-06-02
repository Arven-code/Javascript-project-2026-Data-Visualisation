const largeur = 900;
const hauteur = 700;
const marges = 25;

const svg = d3
.select("body")
.append("svg")
.attr("width", largeur)
.attr("height", hauteur)
.style("border", "1px solid black");

const carte = svg.append("g");

const panneau = d3.select("#panneau");

let details = [];

d3.csv("data/F8015.20260507T100507.csv").then(function(donnees)
{
    details = donnees;
});

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

    const couleur = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([
        d3.min(donneesGeo.features, function(d) { return d.properties.valeur; }),
        d3.max(donneesGeo.features, function(d) { return d.properties.valeur; })
    ]);

    carte
    .selectAll("path")
    .data(donneesGeo.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", function(d)
    {
        if(d.properties.valeur != undefined)
        {
            return couleur(d.properties.valeur);
        }
        else
        {
            return "lightgrey";
        }
    })
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .on("click", function(event, d)
    {
        afficherDetails(d.properties.name);
    });
}

function afficherDetails(comte)
{
    const lignes = details.filter(function(d)
    {
        return d["Census Year"] == "2022"
        && d["Sex"] == "Both sexes"
        && d["Age Group"] == "All ages"
        && normaliser(d["Administrative Counties"]) == normaliser(comte);
    });

    panneau.html("");

    panneau
    .append("h3")
    .text(comte);

    if(lignes.length == 0)
    {
        panneau
        .append("p")
        .text("No details loaded.");
    }

    lignes.forEach(function(d)
    {
        panneau
        .append("p")
        .text(d["Frequency of speaking Irish"] + " | " + d["Level of Irish Spoken"] + " : " + d["VALUE"]);
    });
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
