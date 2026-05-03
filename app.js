function shuffle(data) {
    return data.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

}

function extractLatLongFromGoogleMaps(latLongString) {
  let decimalDegrees = '-?\\d+(?:\\.\\d+)?';
  let coordinatePair = new RegExp(`(${decimalDegrees})\\s*,\\s*(${decimalDegrees})`);
  let match = latLongString.match(coordinatePair);

  if (!match) {
    return [undefined, undefined];
  }

  let lat = Number(match[1]);
  let long = Number(match[2]);

  if (lat < -90 || lat > 90 || long < -180 || long > 180) {
    return [undefined, undefined];
  }

  return [lat, long];
}

let numberOfQuestions = document.getElementById('numberOfQuestions').value || 2;
let currentIndex = 0;
let results = [];

let multipleChoiceButtons = () => ([...document.getElementById('multipleChoicesContainer').getElementsByTagName('button')])

document.getElementById('numberOfQuestions').addEventListener('change', function() {
  console.log('Number of questions:', this.value);
  numberOfQuestions = this.value;
});

let locationCoordinates = {
  melbourne: { swlat: -38.015056522315, swlong: 144.5385483707626, nelat: -37.58960704906771, nelong: 145.4644329517832 },
  wilsonsProm: { swlat: -39.15380623139274, swlong: 144.56, nelat: -38.7739805810115, nelong: 147.6 },
  victoria: { swlat: -39.2, swlong: 140.5, nelat: -33.9, nelong: 150.1 },
  australia: { swlat: -44.32569739068832, swlong: 111.81297712054247, nelat: -11.524606117947133, nelong: 152.64407854033962 }
};

let locationLabels = {
  melbourne: 'Melbourne, VIC, Australia',
  wilsonsProm: "Wilson's Promontory, VIC, Australia",
  victoria: 'Victoria, Australia',
  australia: 'Australia'
};

let locationId = document.getElementById('location').value || 'melbourne';
document.getElementById('location').addEventListener('change', function() {
  console.log('Location:', this.value);
  locationId = this.value;
  latitude = undefined;
  longitude = undefined;
  document.getElementById('maps').value = '';
  document.getElementById('placeBar').textContent = locationLabels[locationId];
});

let latitude, longitude;
document.getElementById('maps').addEventListener('change', function() {
  console.log('Location:', this.value);
  let res = extractLatLongFromGoogleMaps(this.value)
  latitude = res[0]
  longitude = res[1]
  document.getElementById('placeBar').textContent = hasCustomLocation() ? `${latitude}, ${longitude}` : locationLabels[locationId];
});

function hasCustomLocation() {
  return Number.isFinite(latitude) && Number.isFinite(longitude);
}

function speciesName(d) {
  if (d.species_guess) {
    return `(${d.species_guess}) ${d.taxon.name}`;
  }
  return d.taxon.name;
}

function commonName(d) {
  return d.taxon?.common_name?.name || d.taxon?.preferred_common_name || '';
}

function observationLatitude(d) {
  if (d.latitude) {
    return Number(d.latitude);
  }
  if (d.location) {
    return Number(d.location.split(',')[0]);
  }
  return d.geojson?.coordinates?.[1];
}

function observationLongitude(d) {
  if (d.longitude) {
    return Number(d.longitude);
  }
  if (d.location) {
    return Number(d.location.split(',')[1]);
  }
  return d.geojson?.coordinates?.[0];
}

function observationPhotoUrl(d) {
  let photo = d.photos?.[0];

  if (!photo) {
    return '';
  }

  return photo.medium_url || photo.url?.replace(/\/square\.(jpg|jpeg|png)$/i, '/medium.$1') || '';
}

function ancestrySimilarity(ancestry1, ancestry2) {
  let split1 = ancestry1.split('/');
  let split2 = ancestry2.split('/');
  let minLength = Math.min(split1.length, split2.length);

  for (let i = 0; i < minLength; i++) {
    if (split1[i] !== split2[i]) {
      return i;
    }
  }
  return minLength;
}

function getClosestAncestryOptions(targetAncestry, targetName, allData, numberOfOptions) {
  let sortedData = allData.slice().sort((a, b) => {
    return ancestrySimilarity(b.taxon.ancestry, targetAncestry) - ancestrySimilarity(a.taxon.ancestry, targetAncestry);
  });

  let uniqueSpecies = new Set();
  let closestOptions = [];

  for (let i = 0; i < sortedData.length && closestOptions.length < numberOfOptions; i++) {
    let species = speciesName(sortedData[i]);
    if (!uniqueSpecies.has(species) && species != targetName) {
      uniqueSpecies.add(species);
      closestOptions.push(sortedData[i]);
    }
  }

  return closestOptions;
}

// sometimes inat returns results that aren't actually in the area
function filterLocation(data, lat, long) {
  let coords;
  const area = 2;

  if (Number.isFinite(lat) && Number.isFinite(long)) {
    coords = {
      swlat: lat - area,
      swlong: long - area,
      nelat: lat + area,
      nelong: long + area
    };
  } else {
    coords = locationCoordinates[locationId];
  }

  return data.filter(d => {
    let lat = observationLatitude(d);
    let long = observationLongitude(d);

    return lat >= coords.swlat &&
           lat <= coords.nelat &&
           long >= coords.swlong &&
           long <= coords.nelong;
  });
}

function runQuiz() {
  document.body.classList.remove('setup-mode');
  document.getElementById('quiz').style.display = 'block';

  document.getElementById('loadingMessage').style.display = 'block';
  document.getElementById('photoPlaceholder').style.display = 'none';
  currentIndex = 0;
  results = []

  let baseUrl = 'https://api.inaturalist.org/v1';
  let endpoint = '/observations';
  let restrictions = 'photos=true&geo=true';
  let qualitygrade = 'research';
  let locationString
  
  if (hasCustomLocation()) {
    let area = 2;
    locationString = `swlat=${latitude - area}&swlng=${longitude - area}&nelat=${latitude + area}&nelng=${longitude + area}`
  } else {
    locationString = `swlat=${locationCoordinates[locationId].swlat}&swlng=${locationCoordinates[locationId].swlong}&nelat=${locationCoordinates[locationId].nelat}&nelng=${locationCoordinates[locationId].nelong}`
  }
  let perPage = numberOfQuestions * 50;

  let taxaElement = document.getElementById('iconicTaxa');
  let iconicTaxas = Array.from(taxaElement.querySelectorAll("option:checked"), e => e.value)
    .map(taxa => `iconic_taxa[]=${taxa}`)
    .join("&");
  if (iconicTaxas == "iconic_taxa[]=All") {
    iconicTaxas = ""
  }

  let url = `${baseUrl}${endpoint}?${restrictions}&quality_grade=${qualitygrade}&${locationString}&per_page=${perPage}&${iconicTaxas}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw `iNaturalist returned ${response.status}`;
      }
      return response.json();
    })
    .then(responseData => {
      let unshuffledData = responseData.results || responseData;
      unshuffledData = filterLocation(unshuffledData, latitude, longitude)
      let data = shuffle(unshuffledData)

      if (data.length < numberOfQuestions) {
        throw `Expected at least ${numberOfQuestions} observations but got ${data}`
      }

      let observations = [];
      for (let i = 0; i < numberOfQuestions; i++) {
        let randomIndex = Math.floor(Math.random() * data.length);
        let item = data.splice(randomIndex, 1)[0];
        observations.push(item);
      }

      console.log(observations);
      document.getElementById('loadingMessage').style.display = 'none';
      document.getElementById('myImg').style.display = 'block'

      function setupQuestion(index) {
        let answered = false;

        document.getElementById('counter').textContent = `Question ${index + 1} of ${numberOfQuestions}`;

        let img = document.getElementById('myImg');
        img.classList.add('grey-square');
        img.onload = null;
        img.onerror = null;
        img.onload = function() {
          img.classList.remove('grey-square'); // Remove the grey square class
        };
        img.onerror = function() {
          img.classList.add('grey-square');
        };
        img.src = observationPhotoUrl(observations[index]);
        document.getElementById('showAnswerButton').style.display = 'block';
        document.getElementById('multipleChoicesContainer').style.display = 'block';

        let targetAncestry = observations[index].taxon.ancestry;
        let closestOptions = getClosestAncestryOptions(targetAncestry, speciesName(observations[index]), data, multipleChoiceButtons().length - 1);
        let multipleChoices = shuffle([
          ...closestOptions.map(x => speciesName(x)),
          speciesName(observations[index])
        ])

        multipleChoiceButtons().forEach(el => el.outerHTML += "") // tear down element to clear all previous event listeners          

        multipleChoiceButtons().forEach((el, i) => {
          el.classList.remove('choice-correct', 'choice-wrong', 'choice-selected');
          el.disabled = false;
          el.textContent = multipleChoices[i] || ''
          el.style.display = multipleChoices[i] ? '' : 'none'

          el.addEventListener('click', function() {
            if (answered) {
              return;
            }

            answered = true;
            multipleChoiceButtons().forEach(b => {
              let isCorrect = speciesName(observations[index]) == b.textContent;
              if (isCorrect) {
                b.classList.add('choice-correct');
              }
              if (b == el && !isCorrect) {
                b.classList.add('choice-wrong');
              }
              if (b == el) {
                b.classList.add('choice-selected');
              }
              b.disabled = true;
            });
            results.push({ correctAnswer: speciesName(observations[index]), yourAnswer: el.textContent })
            document.getElementById('showAnswerButton').click();
          });
        });

        document.getElementById('scientific_name').textContent = observations[index].taxon.name;
        document.getElementById('common_name').textContent = commonName(observations[index]);
        document.getElementById('placeGuess').textContent = observations[index]?.place_guess;
      }

      setupQuestion(0);

      document.getElementById('showAnswerButton').addEventListener('click', function() {
        document.getElementById('answer').style.display = 'block';
        this.style.display = 'none';
        document.getElementById('nextButton').style.display = 'block';
      });

      document.getElementById('nextButton').addEventListener('click', function() {

        // Replace the image with a grey square using CSS
        let img = document.getElementById('myImg');
        img.classList.add('grey-square');
        img.src = ''; // Clear the image source

        currentIndex++;
        if (currentIndex < observations.length) {
          setupQuestion(currentIndex);
          document.getElementById('answer').style.display = 'none';
          document.getElementById('nextButton').style.display = 'none';
        } else {
          document.body.classList.add('results-mode');
          document.getElementById('quiz').style.display = 'none';
          document.getElementById('results').style.display = 'block';
          console.log(results)
          let resultsElement = document.getElementById('results');
          resultsElement.replaceChildren();

          let score = document.createElement('p');
          score.textContent = `You got ${results.filter(x => x.yourAnswer == x.correctAnswer).length} out of ${results.length} correct`;
          resultsElement.appendChild(score);

          results.forEach((r) => {
            if (r.yourAnswer == r.correctAnswer) { return }

            let correction = document.createElement('p');
            correction.textContent = `You said ${r.yourAnswer}, but it was a ${r.correctAnswer}`;
            resultsElement.appendChild(correction);
          });

          let restartContainer = document.createElement('p');
          let restartButton = document.createElement('button');
          restartButton.textContent = 'Start another quiz';
          restartButton.addEventListener('click', function() {
            window.location.reload();
          });
          restartContainer.appendChild(restartButton);
          resultsElement.appendChild(restartContainer);
        }
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('loadingMessage').textContent = `Could not create quiz: ${error}`;
    });
}

document.getElementById('startQuiz').addEventListener('click', function() {
  runQuiz();
  this.style.display = 'none';
  document.getElementById('setup').style.display = 'none';
});
