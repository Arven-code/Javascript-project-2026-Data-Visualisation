(
function()
{
const largeur = 900;
const hauteur = 700;

const FICHIER_MAIN = "data/F8002.20260619T220645.csv?v=7";
const FICHIER_DETAILS = "data/F8015.20260507T100507.csv?v=7";
const FICHIER_GEOJSON = "data/ireland_counties.geojson?v=7";

const OPACITE_NORMALE = 1;
const OPACITE_SURVOL = 0.78;
const OPACITE_SELECTION = 0.72;

const svg = d3
.select("#carte")
.append("svg")
.attr("width", largeur)
.attr("height", hauteur)
.style("border", "1px solid black");

const carte = svg.append("g");

const panneau = d3.select("#panneau");
const message = d3.select("#message");

let details = [];
let comteSelectionne = "";
let formes;
let isopletheChargee = false;

installerChangementVue();

message
.append("p")
.text("Loading map and data...");

console.log("MAIN =", FICHIER_MAIN);
console.log("DETAILS =", FICHIER_DETAILS);
console.log("GEOJSON =", FICHIER_GEOJSON);

Promise.all([
    d3.csv(FICHIER_DETAILS),
    d3.json(FICHIER_GEOJSON),
    d3.csv(FICHIER_MAIN)
])
.then(function(donnees)
{
    const donneesDetails = donnees[0];
    const donneesGeo = donnees[1];
    const donneesCSV = donnees[2];

    details = donneesDetails;

    console.log("F8015 loaded:", donneesDetails.length, "rows");
    console.log("GeoJSON loaded:", donneesGeo.features ? donneesGeo.features.length : "no features");
    console.log("F8002 loaded:", donneesCSV.length, "rows");

    message.html("");
    dessiner(donneesGeo, donneesCSV);
})
.catch(function(error)
{
    console.error("Loading error:", error);
    message.html(
        "<p><strong>Loading error.</strong></p>" +
        "<p>Check file names and make sure you are using localhost.</p>"
    );
});

function dessiner(donneesGeo, donneesCSV)
{
    if(!donneesGeo || !donneesGeo.features || !Array.isArray(donneesGeo.features))
    {
        message.html("<p><strong>Error:</strong> invalid GeoJSON structure.</p>");
        return;
    }

    const donnees = donneesCSV.filter(function(d)
    {
        return String(d["Census Year"]).trim() == "2022"
        && String(d["Sex"]).trim() == "Both sexes"
        && String(d["Statistic Label"]).trim() == "Irish speakers as a percentage of total"
        && String(d["County of Usual Residence"]).trim() != "State";
    });

    console.log("Rows after filter:", donnees.length);
    console.log("Filtered counties:", donnees.map(function(d)
    {
        return d["County of Usual Residence"];
    }));

    if(donnees.length === 0)
    {
        message.html(
            "<p><strong>Error:</strong> no rows matched the choropleth filter.</p>" +
            "<p>Check the exact column values in F8002.</p>"
        );
        return;
    }

    donneesGeo.features.forEach(function(f)
    {
        f.properties.unite = cleStatistique(nomComteGeo(f.properties));
        f.properties.nomAffiche = nomAffiche(f.properties.unite);
        f.properties.valeur = undefined;
    });

    donneesGeo.features.forEach(function(f)
    {
        donnees.forEach(function(d)
        {
            if(f.properties.unite == cleStatistique(d["County of Usual Residence"]))
            {
                f.properties.valeur = +d["VALUE"];
            }
        });
    });

    const valeurs = donneesGeo.features
    .map(function(d) { return d.properties.valeur; })
    .filter(function(d) { return d != undefined && isNaN(d) == false; });

    console.log("Matched map shapes:", valeurs.length);

    if(valeurs.length === 0)
    {
        message.html(
            "<p><strong>Error:</strong> the data loaded, but no county values matched the GeoJSON names.</p>" +
            "<p>Open the browser console and check the logged county names.</p>"
        );
        return;
    }

    const projection = d3.geoMercator()
    .fitSize([largeur, hauteur], donneesGeo);

    const pathGenerator = d3.geoPath()
    .projection(projection);

    const minimum = d3.min(valeurs);
    const maximum = d3.max(valeurs);

    const couleur = d3.scaleSequential(d3.interpolateYlGnBu)
    .domain([minimum, maximum]);

    carte.selectAll("*").remove();
    svg.selectAll(".legende").remove();
    svg.selectAll("defs").remove();

    formes = carte
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
            return "#eeeeee";
        }
    })
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("fill-opacity", OPACITE_NORMALE)
    .style("cursor", "pointer")
    .on("mouseover", function(event, d)
    {
        if(d.properties.unite != comteSelectionne)
        {
            d3.select(this)
            .attr("fill-opacity", OPACITE_SURVOL);
        }
    })
    .on("mouseout", function(event, d)
    {
        if(d.properties.unite == comteSelectionne)
        {
            d3.select(this)
            .attr("fill-opacity", OPACITE_SELECTION);
        }
        else
        {
            d3.select(this)
            .attr("fill-opacity", OPACITE_NORMALE);
        }
    })
    .on("click", function(event, d)
    {
        comteSelectionne = d.properties.unite;
        afficherDetails(d.properties.unite, d.properties.valeur);
        mettreEnEvidence(d.properties.unite);
    });

    ajouterLegende(couleur, minimum, maximum);

    panneau.html("");

    panneau
    .append("h2")
    .text("County details");

    panneau
    .append("p")
    .text("Click on a county to see more information.");
}

function mettreEnEvidence(unite)
{
    formes
    .attr("fill-opacity", function(d)
    {
        if(d.properties.unite == unite)
        {
            return OPACITE_SELECTION;
        }
        else
        {
            return OPACITE_NORMALE;
        }
    });
}

function afficherDetails(unite, valeur)
{
    const lignes = details.filter(function(d)
    {
        return String(d["Census Year"]).trim() == "2022"
        && String(d["Sex"]).trim() == "Both sexes"
        && String(d["Age Group"]).trim() == "All ages"
        && String(d["Frequency of speaking Irish"]).trim() == "All Irish speakers"
        && cleDetails(d["Administrative Counties"]) == unite;
    });

    const resume = additionnerDetails(lignes);

    panneau.html("");

    panneau
    .append("h2")
    .text(nomAffiche(unite));

    if(valeur != undefined)
    {
        panneau
        .append("p")
        .attr("class", "valeur-principale")
        .text(valeur.toFixed(1) + "%");

        panneau
        .append("p")
        .attr("class", "description-valeur")
        .text("Irish speakers as a percentage of the total population.");
    }
    else
    {
        panneau
        .append("p")
        .text("No main percentage value found for this area.");
    }

    panneau
    .append("h3")
    .text("Ability breakdown");

    if(resume.length == 0)
    {
        panneau
        .append("p")
        .text("No detailed rows found for this area.");
    }

    resume.forEach(function(d)
    {
        const ligne = panneau
        .append("div")
        .attr("class", "ligne-detail");

        ligne
        .append("span")
        .attr("class", "nom-detail")
        .text(d.nom);

        ligne
        .append("span")
        .attr("class", "valeur-detail")
        .text(formatNombre(d.valeur));
    });

    if(unite == "cork" || unite == "limerick" || unite == "waterford")
    {
        panneau
        .append("p")
        .style("font-size", "12px")
        .style("margin-top", "14px")
        .text(nomBase(unite) + " City and " + nomBase(unite) + " County are drawn as separate shapes on the map, but the census percentage is given for them together. The panel therefore gathers them under one statistical unit, so that the interaction follows the data rather than pretending that the boundary line carries a separate value.");
    }

    if(unite == "tipperary")
    {
        panneau
        .append("p")
        .style("font-size", "12px")
        .style("margin-top", "14px")
        .text("Here, the map preserves the boundary as it appears in the geographic file, but the census value speaks at the level of the combined statistical unit, where North and South are pooled together. I therefore kept the visual outline visible, while making the panel follow the unit actually used by the data.");
    }
}

function additionnerDetails(lignes)
{
    const ordre = [
        "Total",
        "Very well",
        "Well",
        "Not well",
        "not stated"
    ];

    const resultat = [];

    ordre.forEach(function(nom)
    {
        let total = 0;
        let trouve = false;

        lignes.forEach(function(d)
        {
            if(nettoyerNiveau(d["Level of Irish Spoken"]) == nom)
            {
                total = total + (+d["VALUE"]);
                trouve = true;
            }
        });

        if(trouve)
        {
            resultat.push({
                nom: nom,
                valeur: total
            });
        }
    });

    return resultat;
}

function ajouterLegende(couleur, minimum, maximum)
{
    const x = largeur - 220;
    const y = hauteur - 80;
    const w = 160;
    const h = 14;

    const defs = svg.append("defs");

    const gradient = defs
    .append("linearGradient")
    .attr("id", "gradient-legende");

    gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", couleur(minimum));

    gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", couleur(maximum));

    svg
    .append("rect")
    .attr("class", "legende")
    .attr("x", x)
    .attr("y", y)
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "url(#gradient-legende)")
    .attr("stroke", "black")
    .attr("stroke-width", 0.3);

    svg
    .append("text")
    .attr("class", "legende")
    .attr("x", x)
    .attr("y", y - 8)
    .text("Percentage")
    .style("font-size", "11px");

    svg
    .append("text")
    .attr("class", "legende")
    .attr("x", x)
    .attr("y", y + 32)
    .text(minimum.toFixed(1) + "%")
    .style("font-size", "11px");

    svg
    .append("text")
    .attr("class", "legende")
    .attr("x", x + w - 35)
    .attr("y", y + 32)
    .text(maximum.toFixed(1) + "%")
    .style("font-size", "11px");
}

function nomComteGeo(p)
{
    if(p.name != undefined) return p.name;
    if(p.NAME != undefined) return p.NAME;
    if(p.Name != undefined) return p.Name;
    if(p.county != undefined) return p.county;
    if(p.COUNTY != undefined) return p.COUNTY;
    if(p.COUNTYNAME != undefined) return p.COUNTYNAME;
    return "";
}

function cleStatistique(texte)
{
    texte = normaliser(texte);

    if(texte == "cork city" || texte == "cork county" || texte == "cork city and cork county")
    {
        return "cork";
    }

    if(texte == "limerick city" || texte == "limerick county" || texte == "limerick city and county")
    {
        return "limerick";
    }

    if(texte == "waterford city" || texte == "waterford county" || texte == "waterford city and county")
    {
        return "waterford";
    }

    if(texte == "north tipperary" || texte == "south tipperary" || texte == "tipperary")
    {
        return "tipperary";
    }

    texte = texte.replace(" county", "");

    return texte;
}

function cleDetails(texte)
{
    texte = normaliser(texte);

    if(texte == "cork city council" || texte == "cork county council")
    {
        return "cork";
    }

    if(texte == "limerick city and county council")
    {
        return "limerick";
    }

    if(texte == "waterford city and county council")
    {
        return "waterford";
    }

    if(texte == "tipperary county council")
    {
        return "tipperary";
    }

    texte = texte.replace(" county council", "");
    texte = texte.replace(" city council", " city");
    texte = texte.replace(" council", "");
    texte = texte.replace(" county", "");

    return texte;
}

function nomAffiche(unite)
{
    if(unite == "cork") return "Cork City and Cork County";
    if(unite == "limerick") return "Limerick City and County";
    if(unite == "waterford") return "Waterford City and County";
    if(unite == "tipperary") return "Tipperary (North and South)";
    if(unite == "dun laoghaire rathdown") return "Dún Laoghaire-Rathdown";
    if(unite == "dublin city") return "Dublin City";
    if(unite == "south dublin") return "South Dublin";
    if(unite == "galway city") return "Galway City";
    if(unite == "galway county") return "Galway County";

    return mettreMajuscules(unite) + " County";
}

function nomBase(unite)
{
    if(unite == "cork") return "Cork";
    if(unite == "limerick") return "Limerick";
    if(unite == "waterford") return "Waterford";

    return mettreMajuscules(unite);
}

function nettoyerNiveau(texte)
{
    if(texte == undefined) return "";

    texte = texte.replace("Speaks Irish - ", "");
    texte = texte.replace("Ability to speak Irish, ", "");

    return texte;
}

function formatNombre(nombre)
{
    return nombre.toLocaleString("en-IE");
}

function mettreMajuscules(texte)
{
    const mots = texte.split(" ");

    const resultat = mots.map(function(mot)
    {
        return mot.charAt(0).toUpperCase() + mot.slice(1);
    });

    return resultat.join(" ");
}

function normaliser(texte)
{
    if(texte == undefined) return "";

    return String(texte)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/-/g, " ")
    .replace(/,/g, "")
    .replace(/  +/g, " ")
    .trim();
}

function installerChangementVue()
{
    const boutonChoroplethe = d3.select("#bouton_choroplethe");
    const boutonIsoplethe = d3.select("#bouton_isoplethe");

    if(boutonChoroplethe.empty() || boutonIsoplethe.empty())
    {
        return;
    }

    boutonChoroplethe.on("click", function()
    {
        afficherVue("choroplethe");
    });

    boutonIsoplethe.on("click", function()
    {
        afficherVue("isoplethe");
    });
}

function afficherVue(nom)
{
    const vueChoroplethe = d3.select("#vue_choroplethe");
    const vueIsoplethe = d3.select("#vue_isoplethe");
    const boutonChoroplethe = d3.select("#bouton_choroplethe");
    const boutonIsoplethe = d3.select("#bouton_isoplethe");

    const ouvrirChoroplethe = nom == "choroplethe";

    vueChoroplethe.classed("vue-active", ouvrirChoroplethe);
    vueIsoplethe.classed("vue-active", !ouvrirChoroplethe);
    boutonChoroplethe.classed("actif", ouvrirChoroplethe);
    boutonIsoplethe.classed("actif", !ouvrirChoroplethe);

    if(nom == "isoplethe" && isopletheChargee == false)
    {
        chargerIsoplethe();
    }
}

function chargerIsoplethe()
{
    isopletheChargee = true;

    d3.select("body")
    .append("script")
    .attr("src", "iso/script_iso.js?v=24");
}
}());
