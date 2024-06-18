Array.prototype.sample = function() {
  return this[Math.floor(Math.random() * this.length)];
};

function shuffle(data) {
    return data.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

}

let numberOfQuestions = 2;
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
  victoria: { swlat: -39.08272063128122, swlong: 140.55699723939387, nelat: -39.08272063128122, nelong: 140.55699723939387 },
  australia: { swlat: -44.32569739068832, swlong: 111.81297712054247, nelat: -11.524606117947133, nelong: 152.64407854033962 }
};

let locationId = 'melbourne';
document.getElementById('location').addEventListener('change', function() {
  console.log('Location:', this.value);
  locationId = this.value;
});

function speciesName(d) {
  if (d.species_guess) {
    return `(${d.species_guess}) ${d.taxon.name}`;
  }
  return d.taxon.name;
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

function runQuiz() {
  document.getElementById('loadingMessage').style.display = 'block';
  results = []

  let baseUrl = 'https://inaturalist.org';
  let endpoint = '/observations';
  let restrictions = 'has[]=photos&has=geo';
  let qualitygrade = 'research';
  let locationString = `swlat=${locationCoordinates[locationId].swlat}&swlong=${locationCoordinates[locationId].swlong}&nelat=${locationCoordinates[locationId].nelat}&nelong=${locationCoordinates[locationId].nelong}`;
  let perPage = numberOfQuestions * 10;

  let taxaElement = document.getElementById('iconicTaxa');
  let iconicTaxas = Array.from(taxaElement.querySelectorAll("option:checked"), e => e.value)
    .map(taxa => `iconic_taxa[]=${taxa}`)
    .join("&");

  // let randomHourFilter = `h1=${Math.floor(Math.random() * 8).toString()}&h2=23`;

  let url = `${baseUrl}${endpoint}.json?${restrictions}&quality_grade=${qualitygrade}&${locationString}&per_page=${perPage}&${iconicTaxas}`;

  fetch(url)
    .then(response => response.json())
    .then(unshuffledData => {
      let data = shuffle(unshuffledData)
      let allNames = data.map(d => speciesName(d));

      let observations = [];
      for (let i = 0; i < numberOfQuestions; i++) {
        let randomIndex = Math.floor(Math.random() * data.length);
        let item = data.splice(randomIndex, 1)[0];
        observations.push(item);
      }

      console.log(observations);
      document.getElementById('loadingMessage').style.display = 'none';

      function setupQuestion(index) {
        let img = document.getElementById('myImg');
        img.src = observations[index]?.photos[0]?.medium_url;
        img.onload = function() {
          img.classList.remove('grey-square'); // Remove the grey square class
          document.getElementById('showAnswerButton').style.display = 'block';
          document.getElementById('multipleChoicesContainer').style.display = 'block';
        };

        let targetAncestry = observations[index].taxon.ancestry;
        let closestOptions = getClosestAncestryOptions(targetAncestry, speciesName(observations[index]), data, multipleChoiceButtons().length - 1);
        let multipleChoices = shuffle([
          ...closestOptions.map(x => speciesName(x)),
          speciesName(observations[index])
        ])

        multipleChoiceButtons().forEach(el => el.outerHTML += "") // tear down element to clear all previous event listeners          

        multipleChoiceButtons().forEach((el, i) => {
          el.style.backgroundColor = ''
          el.textContent = multipleChoices[i]

          el.addEventListener('click', function() {
            multipleChoiceButtons().forEach(b => {
              b.style.backgroundColor = speciesName(observations[index]) == b.textContent ? 'lightgreen' : 'pink';
            });
            results.push({ correctAnswer: speciesName(observations[index]), yourAnswer: el.textContent })
            document.getElementById('showAnswerButton').click();
          });
        });

        document.getElementById('scientific_name').textContent = observations[index].taxon.name;
        document.getElementById('common_name').textContent = observations[index].taxon?.common_name?.name;
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
          document.getElementById('quiz').style.display = 'none';
          document.getElementById('results').style.display = 'block';
          console.log(results)
          document.getElementById('results').innerHTML = `<p>You got ${results.filter(x => x.yourAnswer == x.correctAnswer).length} out of ${results.length} correct</p>`
          document.getElementById('results').innerHTML += results.map((r) => {
            if (r.yourAnswer == r.correctAnswer) { return "" }
            return `<p>You said ${r.yourAnswer}, but it was a ${r.correctAnswer}</p>`
          }).join("")
          document.getElementById('results').innerHTML += "<p><button onClick='window.location.reload();'>Start another quiz</button></p>"
        }
      });
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('loadingMessage').style.display = 'none';
    });
}

document.getElementById('startQuiz').addEventListener('click', function() {
  runQuiz();
  this.style.display = 'none';
  document.getElementById('setup').style.display = 'none';
});
