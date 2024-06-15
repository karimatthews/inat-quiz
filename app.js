
let numberOfQuestions = 10;

document.getElementById('numberOfQuestions').addEventListener('change', function () {
  console.log('Number of questions:', this.value);
  numberOfQuestions = this.value;
});

function runQuiz() {
  let baseUrl = 'https://inaturalist.org';
  let endpoint = '/observations';
  let restrictions = 'photos';
  let qualitygrade = 'research';
  let perPage = numberOfQuestions

  let url = `${baseUrl}${endpoint}.json?has[]=${restrictions}&qualitygrade=${qualitygrade}&per_page=${perPage}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data)

      // Set initial values to first observation in list
      let img = document.getElementById('myImg');

      img.src = data[0].photos[0].medium_url;
      img.onload = function () {
        // Show the Show Answer button
        document.getElementById('showAnswerButton').style.display = 'block'
      };

      document.getElementById('scientific_name').textContent = data[0].taxon.name;
      document.getElementById('common_name').textContent = data[0].taxon.common_name.name;

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

        if (currentIndex >= data.length) {
          currentIndex = 0; // Loop back to the first image when reaching the end
        }

        let img = document.getElementById('myImg');
        img.src = data[currentIndex].photos[0].medium_url;
        document.getElementById('scientific_name').textContent = data[currentIndex].taxon.name;
        document.getElementById('common_name').textContent = data[currentIndex].taxon?.common_name?.name;

        img.onload = function () {
          // Show the Show Answer button after the image loads
          document.getElementById('showAnswerButton').style.display = 'block'
        };

      });
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// Start quiz on button click
document.getElementById('startQuiz').addEventListener('click', function () {
  runQuiz();
  this.style.display = 'none';
  document.getElementById('setup').style.display = 'none';
});