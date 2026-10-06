// Quick test: fetch Ashby page and extract jobPostings
const url = 'https://jobs.ashbyhq.com/ashby';

fetch(url)
  .then(res => res.text())
  .then(html => {
    const match = html.match(/window\.__appData\s*=\s*(\{.+?\});/s);
    if (!match) {
      console.log('NO MATCH');
      return;
    }
    
    const appData = JSON.parse(match[1]);
    
    if (appData.jobBoard?.jobPostings) {
      console.log(`Found ${appData.jobBoard.jobPostings.length} jobs`);
      console.log('Sample:', JSON.stringify(appData.jobBoard.jobPostings[0], null, 2));
    } else {
      console.log('Structure:', Object.keys(appData));
    }
  })
  .catch(err => console.error('ERROR:', err.message));
