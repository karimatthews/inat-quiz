
let numberOfQuestions = 10;

document.getElementById('numberOfQuestions').addEventListener('change', function () {
  console.log('Number of questions:', this.value);
  numberOfQuestions = this.value;
});

let locationCoordinates = {
  melbourne: { swlat: -38.015056522315, swlong: 144.5385483707626, nelat: -37.58960704906771, nelong: 145.4644329517832 },
  wilsonsProm: { swlat: -39.15380623139274, swlong: 144.56, nelat: -38.7739805810115, nelong: 147.6 },
  victoria: { swlat: -39.08272063128122, swlong: 140.55699723939387, nelat: -39.08272063128122, nelong: 140.55699723939387 },
  australia: { swlat: -44.32569739068832, swlong: 111.81297712054247, nelat: -11.524606117947133, nelong: 152.64407854033962 }
}

let locationId = ''
document.getElementById('location').addEventListener('change', function () {
  console.log('Location:', this.value);
  locationId = this.value;
});

function runQuiz() {
  // Display the loading message
  document.getElementById('loadingMessage').style.display = 'block';

  let baseUrl = 'https://inaturalist.org';
  let endpoint = '/observations';
  let restrictions = 'has[]=photos&has=geo';
  let qualitygrade = 'research';
  let locationString = `swlat=${locationCoordinates[locationId].swlat}&swlong=${locationCoordinates[locationId].swlong}&nelat=${locationCoordinates[locationId].nelat}&nelong=${locationCoordinates[locationId].nelong}`;
  let perPage = numberOfQuestions * 100

  let url = `${baseUrl}${endpoint}.json?${restrictions}&quality_grade=${qualitygrade}&${locationString}&per_page=${perPage}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {

      let observations = [];

      for (let i = 0; i < numberOfQuestions; i++) {
        let randomIndex = Math.floor(Math.random() * data.length);
        let item = data.splice(randomIndex, 1)[0];
        observations.push(item);
      }

      console.log(observations)
      // Hide the loading message
      document.getElementById('loadingMessage').style.display = 'none';

      // Set initial values to first observation in list
      let img = document.getElementById('myImg');

      img.src = observations[0]?.photos[0]?.medium_url;
      img.onload = function () {
        // Show the Show Answer button
        document.getElementById('showAnswerButton').style.display = 'block'
      };

      document.getElementById('scientific_name').textContent = observations[0].taxon.name;
      document.getElementById('common_name').textContent = observations[0].taxon?.common_name?.name;
      document.getElementById('placeGuess').textContent = observations[0]?.place_guess;

      let currentIndex = 0;

      // Show answers on button click
      document.getElementById('showAnswerButton').addEventListener('click', function () {
        document.getElementById('answer').style.display = 'block';
        this.style.display = 'none';
        document.getElementById('nextButton').style.display = 'block'
      });

      document.getElementById('nextButton').addEventListener('click', function () {
        currentIndex++;

        // Hide the answers
        document.getElementById('answer').style.display = 'none';
        document.getElementById('nextButton').style.display = 'none'

        if (currentIndex >= observations.length) {
          document.getElementById('results').style.display = 'block' // Loop back to the first image when reaching the end
        }

        let img = document.getElementById('myImg');
        img.src = observations[currentIndex].photos[0].medium_url;
        document.getElementById('scientific_name').textContent = observations[currentIndex].taxon.name;
        document.getElementById('common_name').textContent = observations[currentIndex].taxon?.common_name?.name;
        document.getElementById('placeGuess').textContent = observations[currentIndex]?.place_guess;

        img.onload = function () {
          // Show the Show Answer button after the image loads
          document.getElementById('showAnswerButton').style.display = 'block'
        };

      });
    })
    .catch(error => {
      console.error('Error:', error);
      // Hide the loading message
      document.getElementById('loadingMessage').style.display = 'none';
    });
}

// Start quiz on button click
document.getElementById('startQuiz').addEventListener('click', function () {
  runQuiz();
  this.style.display = 'none';
  document.getElementById('setup').style.display = 'none';
});