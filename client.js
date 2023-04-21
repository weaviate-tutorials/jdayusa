// Load style sheet
document.getElementsByTagName('head')[0].insertAdjacentHTML(
  'beforeend',
  '<link rel="stylesheet" href="https://search-modal.msar.me/dist/style.css" />'
);

// Client search code
import SearchModal from 'https://unpkg.com/search-modal?module';

const instance = SearchModal({
  autoInit: true,
  searchUrl: 'https://joomla-proxy.dandv.me',
  searchKey: 'search',
  // transform the data
  transform: (data) => data.map(item => ({
    title: `${item.speaker} - ${item.title}`,
    // category: 'Session',
    excerpt: item.description,
    url: item.url,
  })),
  callback: (event, data) => {
    console.log({event, data});
    // TODO
    const footer = document.querySelector('.search-modal-footer');
    footer.innerHTML = `
<div style="padding: 1em; display: flex; justify-content: space-between;">
<div><img alt="Weaviate logo" style="height: 2em" src="https://weaviate.io/assets/images/weaviate-nav-logo-light-532fdca50b4e5f974111eaf70c36080c.svg"></div>
<div>Powered by Weaviate</div>
</div>
`;

  }
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
     instance.open();
  }
});
