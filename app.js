
fetch('https://inaturalist.org/observations.json?has[]=photos&has[]=geoper_page=1')
  .then(response => response.json())
  .then(data => {
    const div = document.getElementById('photo');
    const img = document.createElement('img');

    img.src = data[0].photos[0].medium_url;
    div.appendChild(img);
  })
  .catch(error => {
    console.error('Error:', error);
  });