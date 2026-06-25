const largeur = 900;
const hauteur = 700;

const cheminGeo = "../data/isopleth/electoral_divisions.geojson?v=22";
const cheminSaps = "../data/isopleth/SAPS_Table_3_1_ED_Irish.csv?v=22";

const svg = d3
.select("#carte")
.append("svg")
.attr("width", largeur)
.attr("height", hauteur)
.style("cursor", "crosshair");

const defs = svg.append("defs");

const carte = svg.append("g");

const coucheFond = carte.append("g").style("pointer-events", "none");
const coucheInteractionFond = carte.append("g");
const coucheSurface = carte.append("g");
const coucheContours = carte.append("g").style("pointer-events", "none");
const coucheFrontieres = carte.append("g").style("pointer-events", "none");
const coucheInteraction = carte.append("g");
const coucheSelection = carte.append("g").style("pointer-events", "none");
const coucheLegende = svg.append("g").style("pointer-events", "none");
const coucheLecture = svg.append("g").style("pointer-events", "none");

const panneau = d3.select("#panneau");

let featureActive = undefined;

Promise.all([
    d3.json(cheminGeo),
    d3.csv(cheminSaps)
]).then(function(donnees)
{
    const donneesGeo = donnees[0];
    const donneesSaps = donnees[1];

    dessinerCarte(donneesGeo, donneesSaps);
})
.catch(function(error)
{
    console.log(error);

    panneau.html(
        "<h2>Error</h2>" +
        "<p>The isopleth data could not be loaded. Check the file names in data/isopleth.</p>"
    );
});

function dessinerCarte(donneesGeo, donneesSaps)
{
    const donneesParCode = preparerDonnees(donneesSaps);

    const projection = choisirProjection(donneesGeo);
    const pathGenerator = d3.geoPath().projection(projection);

    donneesGeo.features.forEach(function(feature)
    {
        const code = normaliserCode(feature.properties.ED_ID_STR);

        if(donneesParCode.has(code))
        {
            feature.properties.donnees = donneesParCode.get(code);
        }
    });

    const featuresAvecValeur = donneesGeo.features.filter(function(feature)
    {
        return feature.properties.donnees != undefined;
    });

    console.log("Electoral Divisions in GeoJSON:", donneesGeo.features.length);
    console.log("Rows in SAPS table:", donneesSaps.length);
    console.log("Matched Electoral Divisions:", featuresAvecValeur.length);

    if(featuresAvecValeur.length === 0)
    {
        panneau.html(
            "<h2>No match</h2>" +
            "<p>The GeoJSON is loaded, but no Electoral Division could be matched with the SAPS table.</p>"
        );

        return;
    }

    const clip = defs
    .append("clipPath")
    .attr("id", "clip-irlande")
    .attr("clipPathUnits", "userSpaceOnUse");

    clip
    .selectAll("path")
    .data(donneesGeo.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator);

    const points = featuresAvecValeur.map(function(feature)
    {
        const centre = pathGenerator.centroid(feature);

        return {
            x: centre[0],
            y: centre[1],
            feature: feature,
            valeur: feature.properties.donnees.pourcentage
        };
    });

    const grille = creerGrille(points, largeur, hauteur);

    const minGrille = d3.min(grille.valeurs);
    const maxGrille = d3.max(grille.valeurs);

    console.log("Grid minimum:", minGrille);
    console.log("Grid maximum:", maxGrille);

    const couleur = d3.scaleSequential()
    .domain([minGrille, maxGrille])
    .interpolator(d3.interpolateYlGnBu);

    coucheFond
    .selectAll("path")
    .data(donneesGeo.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", "#f5f5f5")
    .attr("stroke", "#eeeeee")
    .attr("stroke-width", 0.08);

    featureActive = undefined;

    coucheInteractionFond
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", largeur)
    .attr("height", hauteur)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0)
    .style("pointer-events", "all")
    .on("mousemove", function()
    {
        if(featureActive != undefined)
        {
            featureActive = undefined;
            cacherSelection();
            initialiserLecture();
            initialiserPanneau();
        }
    })
    .on("click", function()
    {
        featureActive = undefined;
        cacherSelection();
        initialiserLecture();
        initialiserPanneau();
    });

    coucheSurface
    .attr("clip-path", "url(#clip-irlande)")
    .selectAll("rect")
    .data(grille.cellules)
    .enter()
    .append("rect")
    .attr("x", function(d) { return d.x; })
    .attr("y", function(d) { return d.y; })
    .attr("width", grille.largeurCellule + 1)
    .attr("height", grille.hauteurCellule + 1)
    .attr("fill", function(d) { return couleur(d.valeur); })
    .attr("opacity", 0.92)
    .style("pointer-events", "all")
    .on("mousemove", function(event, cellule)
    {
        if(cellule != undefined && cellule.feature != undefined)
        {
            if(cellule.feature !== featureActive)
            {
                featureActive = cellule.feature;
                afficherSelection(cellule.feature, pathGenerator);
                afficherLecture(cellule.feature);
                afficherDetailsRapides(cellule.feature);
            }
        }
    })
    .on("click", function(event, cellule)
    {
        if(cellule != undefined && cellule.feature != undefined)
        {
            featureActive = cellule.feature;
            afficherSelection(cellule.feature, pathGenerator);
            afficherLecture(cellule.feature);
            afficherDetailsComplets(cellule.feature);
        }
    });

    const seuils = creerSeuils(minGrille, maxGrille);

    const contours = d3.contours()
    .size([grille.nbColonnes, grille.nbLignes])
    .thresholds(seuils)
    .smooth(true)(grille.valeurs);

    console.log("Number of contours:", contours.length);

    const contourPath = d3.geoPath(d3.geoIdentity());

    coucheContours
    .attr("clip-path", "url(#clip-irlande)")
    .attr("transform", "scale(" + grille.largeurCellule + "," + grille.hauteurCellule + ")")
    .selectAll("path")
    .data(contours)
    .enter()
    .append("path")
    .attr("d", contourPath)
    .attr("fill", "none")
    .attr("stroke", "#1f1f1f")
    .attr("stroke-width", 0.5 / grille.largeurCellule)
    .attr("opacity", 0.28);

    coucheFrontieres
    .selectAll("path")
    .data(donneesGeo.features)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", "none")
    .attr("stroke", "#555555")
    .attr("stroke-width", 0.06)
    .attr("opacity", 0.18);

    coucheFrontieres
    .append("path")
    .datum(donneesGeo)
    .attr("d", pathGenerator)
    .attr("fill", "none")
    .attr("stroke", "#222222")
    .attr("stroke-width", 0.9)
    .attr("opacity", 0.75);

    dessinerInteraction(featuresAvecValeur, pathGenerator);
    dessinerLegende(couleur, minGrille, maxGrille);
    initialiserLecture();
    initialiserPanneau();

    svg.on("mouseleave", function()
    {
        featureActive = undefined;
        cacherSelection();
        initialiserLecture();
        initialiserPanneau();
    });
}

function dessinerInteraction(featuresAvecValeur, pathGenerator)
{
    coucheInteraction
    .selectAll("path")
    .data(featuresAvecValeur)
    .enter()
    .append("path")
    .attr("d", pathGenerator)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0)
    .attr("stroke", "none")
    .style("pointer-events", "all")
    .on("mousemove", function(event, feature)
    {
        if(feature !== featureActive)
        {
            featureActive = feature;
            afficherSelection(feature, pathGenerator);
            afficherLecture(feature);
            afficherDetailsRapides(feature);
        }
    })
    .on("click", function(event, feature)
    {
        featureActive = feature;
        afficherSelection(feature, pathGenerator);
        afficherLecture(feature);
        afficherDetailsComplets(feature);
    });
}

function initialiserPanneau()
{
    panneau.html(
        "<h2>Electoral Divisions</h2>" +
        "<p>This exploratory isopleth smooths the percentage of people aged 3 years and over who reported that they can speak Irish.</p>" +
        "<p>Move over the map to read the original Electoral Division value.</p>"
    );
}

function preparerDonnees(donneesSaps)
{
    const donneesParCode = new Map();

    donneesSaps.forEach(function(d)
    {
        const code = normaliserCode(d["ED_ID_STR"]);
        const oui = nombre(d["Yes"]);
        const non = nombre(d["No"]);
        const nonDeclare = nombre(d["Not stated"]);
        const total = nombre(d["Total"]);

        if(code !== "" && total > 0)
        {
            donneesParCode.set(code, {
                code: d["ED_ID_STR"],
                nom: d["ED_ENGLISH"],
                nomIrlandais: d["ED_GAEILGE"],
                comte: d["COUNTY"],
                oui: oui,
                non: non,
                nonDeclare: nonDeclare,
                total: total,
                pourcentage: oui / total * 100
            });
        }
    });

    return donneesParCode;
}

function nombre(valeur)
{
    return Number(String(valeur).replace(/,/g, "").trim());
}

function normaliserCode(code)
{
    if(code == undefined)
    {
        return "";
    }

    return String(code).trim();
}

function choisirProjection(donneesGeo)
{
    const premierPoint = trouverPremierPoint(donneesGeo.features[0].geometry.coordinates);

    if(premierPoint[0] > -20 && premierPoint[0] < 20 && premierPoint[1] > 40 && premierPoint[1] < 60)
    {
        return d3.geoMercator()
        .fitSize([largeur, hauteur], donneesGeo);
    }

    return d3.geoIdentity()
    .reflectY(true)
    .fitSize([largeur, hauteur], donneesGeo);
}

function trouverPremierPoint(coordonnees)
{
    if(typeof coordonnees[0] === "number")
    {
        return coordonnees;
    }

    return trouverPremierPoint(coordonnees[0]);
}

function creerGrille(points, largeurCarte, hauteurCarte)
{
    const nbColonnes = 220;
    const nbLignes = 170;

    const largeurCellule = largeurCarte / nbColonnes;
    const hauteurCellule = hauteurCarte / nbLignes;

    const valeurs = [];
    const cellules = [];

    for(let y = 0; y < nbLignes; y++)
    {
        for(let x = 0; x < nbColonnes; x++)
        {
            const px = x * largeurCellule + largeurCellule / 2;
            const py = y * hauteurCellule + hauteurCellule / 2;

            let numerateur = 0;
            let denominateur = 0;
            let distanceMin = Infinity;
            let featurePlusProche = undefined;

            points.forEach(function(point)
            {
                const dx = px - point.x;
                const dy = py - point.y;
                const distanceCarree = dx * dx + dy * dy;
                const poids = 1 / (distanceCarree + 1600);

                numerateur += point.valeur * poids;
                denominateur += poids;

                if(distanceCarree < distanceMin)
                {
                    distanceMin = distanceCarree;
                    featurePlusProche = point.feature;
                }
            });

            const valeur = numerateur / denominateur;

            valeurs.push(valeur);

            cellules.push({
                x: x * largeurCellule,
                y: y * hauteurCellule,
                valeur: valeur,
                feature: featurePlusProche
            });
        }
    }

    return {
        valeurs: valeurs,
        cellules: cellules,
        nbColonnes: nbColonnes,
        nbLignes: nbLignes,
        largeurCellule: largeurCellule,
        hauteurCellule: hauteurCellule
    };
}

function creerSeuils(minValeur, maxValeur)
{
    const seuils = [];
    const pas = (maxValeur - minValeur) / 8;

    for(let i = 1; i < 8; i++)
    {
        seuils.push(minValeur + i * pas);
    }

    return seuils;
}

function dessinerLegende(couleur, minValeur, maxValeur)
{
    const largeurLegende = 230;
    const hauteurLegende = 12;
    const xLegende = 30;
    const yLegende = hauteur - 48;

    const gradient = defs
    .append("linearGradient")
    .attr("id", "gradient-legende")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

    for(let i = 0; i <= 10; i++)
    {
        const t = i / 10;
        const valeur = minValeur + t * (maxValeur - minValeur);

        gradient
        .append("stop")
        .attr("offset", (t * 100) + "%")
        .attr("stop-color", couleur(valeur));
    }

    coucheLegende
    .append("text")
    .attr("x", xLegende)
    .attr("y", yLegende - 8)
    .text("Smoothed percentage who can speak Irish")
    .style("font-size", "12px");

    coucheLegende
    .append("rect")
    .attr("x", xLegende)
    .attr("y", yLegende)
    .attr("width", largeurLegende)
    .attr("height", hauteurLegende)
    .attr("fill", "url(#gradient-legende)");

    coucheLegende
    .append("text")
    .attr("x", xLegende)
    .attr("y", yLegende + 28)
    .text(minValeur.toFixed(1) + "%")
    .style("font-size", "11px");

    coucheLegende
    .append("text")
    .attr("x", xLegende + largeurLegende)
    .attr("y", yLegende + 28)
    .attr("text-anchor", "end")
    .text(maxValeur.toFixed(1) + "%")
    .style("font-size", "11px");
}

function initialiserLecture()
{
    coucheLecture.selectAll("*").remove();

    coucheLecture
    .append("rect")
    .attr("x", 24)
    .attr("y", 24)
    .attr("width", 240)
    .attr("height", 76)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0.96)
    .attr("stroke", "#bbbbbb");

    coucheLecture
    .append("text")
    .attr("x", 36)
    .attr("y", 48)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Move over the map");

    coucheLecture
    .append("text")
    .attr("x", 36)
    .attr("y", 72)
    .style("font-size", "12px")
    .style("fill", "#555555")
    .text("Original ED values appear here");
}

function afficherLecture(feature)
{
    const donnees = feature.properties.donnees;

    if(donnees == undefined)
    {
        return;
    }

    coucheLecture.selectAll("*").remove();

    coucheLecture
    .append("rect")
    .attr("x", 24)
    .attr("y", 24)
    .attr("width", 260)
    .attr("height", 92)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0.96)
    .attr("stroke", "#bbbbbb");

    coucheLecture
    .append("text")
    .attr("x", 36)
    .attr("y", 47)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text(texteCourt(donnees.nom, 28));

    coucheLecture
    .append("text")
    .attr("x", 36)
    .attr("y", 67)
    .style("font-size", "11px")
    .style("fill", "#555555")
    .text(donnees.comte);

    coucheLecture
    .append("text")
    .attr("x", 36)
    .attr("y", 98)
    .style("font-size", "28px")
    .style("font-weight", "bold")
    .text(donnees.pourcentage.toFixed(1) + "%");
}

function texteCourt(texte, limite)
{
    if(texte == undefined)
    {
        return "";
    }

    if(texte.length <= limite)
    {
        return texte;
    }

    return texte.slice(0, limite - 3) + "...";
}

function afficherSelection(feature, pathGenerator)
{
    const selection = coucheSelection
    .selectAll("path")
    .data([feature]);

    selection
    .enter()
    .append("path")
    .merge(selection)
    .attr("d", pathGenerator)
    .attr("fill", "#ffffff")
    .attr("fill-opacity", 0.28)
    .attr("stroke", "#111111")
    .attr("stroke-width", 1.1)
    .attr("opacity", 1);

    selection.exit().remove();
}

function cacherSelection()
{
    coucheSelection
    .selectAll("path")
    .remove();
}

function afficherDetailsRapides(feature)
{
    const donnees = feature.properties.donnees;

    if(donnees == undefined)
    {
        return;
    }

    panneau.html(
        "<h2>" + donnees.nom + "</h2>" +
        "<div class='ligne-detail'><strong>County:</strong> " + donnees.comte + "</div>" +
        "<div class='valeur-principale'>" + donnees.pourcentage.toFixed(1) + "%</div>" +
        "<p class='note'>This is the original Electoral Division value. The colour surface is smoothed.</p>"
    );
}

function afficherDetailsComplets(feature)
{
    const donnees = feature.properties.donnees;

    if(donnees == undefined)
    {
        panneau.html(
            "<h2>No data</h2>" +
            "<p>No matching SAPS row was found for this Electoral Division.</p>"
        );

        return;
    }

    panneau.html(
        "<h2>" + donnees.nom + "</h2>" +
        "<div class='ligne-detail'><strong>County:</strong> " + donnees.comte + "</div>" +
        "<div class='valeur-principale'>" + donnees.pourcentage.toFixed(1) + "%</div>" +
        "<div class='ligne-detail'><strong>Can speak Irish:</strong> " + donnees.oui.toLocaleString("en-IE") + "</div>" +
        "<div class='ligne-detail'><strong>Cannot speak Irish:</strong> " + donnees.non.toLocaleString("en-IE") + "</div>" +
        "<div class='ligne-detail'><strong>Not stated:</strong> " + donnees.nonDeclare.toLocaleString("en-IE") + "</div>" +
        "<div class='ligne-detail'><strong>Total aged 3+:</strong> " + donnees.total.toLocaleString("en-IE") + "</div>" +
        "<p class='note'>The colour surface shows smoothed values. This panel gives the original Electoral Division value.</p>"
    );
}
