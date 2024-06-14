
fetch('https://inaturalist.org/observations.json?has[]=photos&has[]=geo&qualitygrade=research&per_page=1')
  .then(response => response.json())
  .then(data => {
    console.log(data)
    const div = document.getElementById('photo');
    const img = document.createElement('img');

    img.src = data[0].photos[0].medium_url;
    div.appendChild(img);



    document.getElementById('scientific_name').textContent = data[0].taxon.name;

    document.getElementById('common_name').textContent = data[0].taxon.common_name.name;

    document.getElementById('myButton').addEventListener('click', function () {
      document.getElementById('answer').style.display = 'block';
      this.textContent = 'Answer:';
    });
  })
  .catch(error => {
    console.error('Error:', error);
  });