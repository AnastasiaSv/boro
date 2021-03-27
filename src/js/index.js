import '../scss/index.scss';

const postsContainer = document.querySelector('.posts-container'),
      listContainer = document.querySelector('.list-container'),
      list = document.querySelector('.list'),
      modalContainer = document.querySelector('.modal-container'),
      sortContainer = document.querySelector('.sort'),
      sortLabels = sortContainer.querySelectorAll('label'),
      footer = document.querySelector('.footer'),
      resetButton = document.querySelector('.reset'),
      viewButtons = document.querySelectorAll('input[name="view"]'),
      viewCardsLabel = document.querySelector('.view__cards-label'),
      viewListLabel = document.querySelector('.view__list-label'),
      titleSort = document.querySelectorAll('input[name="title"]'),
      categorySort = document.querySelectorAll('input[name="category"]'),
      dateSort = document.querySelectorAll('input[name="date"]'),
      sizeSort = document.querySelectorAll('input[name="size"]'),
      paginationContainer = document.getElementById('pagination'),
      loader = document.querySelector('.loader'),
      url = 'http://contest.elecard.ru/frontend_data/';

let rows = 16,
    currentPage = 1,
    paginationActiveButtons = 5,
    sortState = {
        sortByTitle: null,
        sortByCategory: null,
        sortByDate: null,
        sortBySize: null
    };

displayCards();

sortListener(titleSort, 'sortByTitle');
sortListener(categorySort, 'sortByCategory');
sortListener(dateSort, 'sortByDate');
sortListener(sizeSort, 'sortBySize');

// Get data
async function getPosts() {
    const res = await fetch(`${url}catalog.json`);
    const data = await res.json();
    return data;
}

// Add listeners to the view switches
viewButtons.forEach(item => {
    item.addEventListener('click', event => {
        let view = event.target.value;

        if (view == 'cards') {
            setDisplay(listContainer, 'none');
            setDisplay(sortContainer, 'flex');
            setDisplay(postsContainer, 'flex');
            setDisplay(footer, 'flex');
            addClass(viewCardsLabel, 'active');
            removeClass(viewListLabel, 'active');
        } else {
            if (list.innerHTML == '') displayList();
            setDisplay(listContainer, 'flex');
            setDisplay(sortContainer, 'none');
            setDisplay(postsContainer, 'none');
            setDisplay(footer, 'none');
            addClass(viewListLabel, 'active');
            removeClass(viewCardsLabel, 'active');
        }
    });
});

// Display data as cards
async function displayCards(status = '') {
    let posts;

    if ((status == 'total') || (localStorage.getItem('posts') === null)) {
        posts = await getPosts();
        posts = addIdsToPosts(posts);
        updateLocalStorage(posts);
    } else {
        posts = JSON.parse(localStorage.getItem('posts'));
    }

    if (sortState.sortByTitle == 'asc') sortAsc(posts, 'image');
    if (sortState.sortByTitle == 'desc') sortDesc(posts, 'image');
    if (sortState.sortByCategory == 'asc') sortAsc(posts, 'category');
    if (sortState.sortByCategory == 'desc') sortDesc(posts, 'category');
    if (sortState.sortByDate == 'asc') sortAsc(posts, 'timestamp');
    if (sortState.sortByDate == 'desc') sortDesc(posts, 'timestamp');
    if (sortState.sortBySize == 'asc') sortAsc(posts, 'filesize');
    if (sortState.sortBySize == 'desc') sortDesc(posts, 'filesize');

    let data = pagination(posts, currentPage, rows);
    let currentPosts = data.currentPosts;
    let pages = data.pages;

    createGrid(posts, currentPosts, pages);
}

// Create a grid of cards
function createGrid(posts, currentPosts, pages) {
    postsContainer.innerHTML = '';
    loader.style.display = 'block';

    for (let i = 0; i < currentPosts.length; i++) {
        let post = currentPosts[i];

        const cardWrapperEl = document.createElement('div');
        cardWrapperEl.classList.add('card-wrapper', 'col-lg-3', 'col-md-4', 'col-sm-12');
        cardWrapperEl.id = post.id;
        cardWrapperEl.innerHTML = `
            <div class="card">
                <button type="button" class="close" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <div class="card-img" style="background-image:url(${url}${post.image})"></div>
                <div class="card-body">
                    <div class="card-text">
                        <p class="card-text-item"><span class="strong">Name</span> ${showName(post.image)}</p>
                        <p class="card-text-item"><span class="strong">Category</span> ${post.category}</p>
                        <p class="card-text-item"><span class="strong">File size</span> ${bytesToSize(post.filesize)}</p>
                        <p class="card-text-item"><span class="strong">Date</span> ${timestampToDate(post.timestamp)}</p>
                    </div>
                </div>
            </div>
        `;

        let closeEl = cardWrapperEl.querySelector('.close');

        closeEl.addEventListener('click', () => {
            posts.forEach((item, i) => {
                if (item.id == cardWrapperEl.id) posts.splice(i, 1);
            });
            console.log(posts);
            updateLocalStorage(posts);
            displayCards();
        });

        postsContainer.appendChild(cardWrapperEl);

        createPaginationButtons(pages);
    }

    loader.style.display = 'none';
}


// Display data as list
async function displayList() {
    loader.style.display = 'block';
    let posts = await getPosts();
    let listArray = groupByProp(posts);
    let parentList = document.createElement('ul');

    for(let key in listArray) {
        let parentLi = createTextElement('li', key, 'show');
        let childList = document.createElement('ul');

        listArray[key].forEach(post => {
            let li = document.createElement('li');
            li.innerHTML = `
                <div class="list-item">
                    <div class="list-item__image"><img src="${url}${post.image}" alt="" /></div>
                    <div class="list-item__info">
                        <div class="list-item__name"><strong>Name</strong> ${showName(post.image)}</div>
                        <div class="list-item__category"><strong>Category</strong> ${post.category}</div>
                        <div class="list-item__filesize"><strong>File size</strong> ${bytesToSize(post.filesize)}</div>
                        <div class="list-item__date"><strong>Date</strong> ${timestampToDate(post.timestamp)}</div>
                    </div>
                </div>
            `;
            childList.append(li);

            li.addEventListener('click', function () {
                let image = createImage(`${url}${post.image}`, 'modal__image');
                modalContainer.innerHTML = '';
                modalContainer.append(image);
                const thumbs = listContainer.querySelectorAll('li');
                removeClassFromElements(thumbs, 'full-size');
                this.classList.toggle('full-size');
                goUp();
            });
        });

        parentLi.append(childList);

        parentLi.addEventListener('click', event => {
            event.stopPropagation();
            toggleThumbs(event);
        });

        loader.style.display = 'none';
        
        parentList.append(parentLi);
    }

    list.innerHTML = '<li class="list__item list__item-root show">categories</li>';
    const listItemRoot = list.querySelector('.list__item-root');

    listItemRoot.append(parentList);
    listItemRoot.addEventListener('click', event => {
        if (event.target.nodeName == 'UL') return;
        event.stopPropagation();
        toggleThumbs(event);
    });
}

// Toggle thumbs by click
function toggleThumbs(event) {
    let childrenList = event.target.querySelector('ul');

    if (!childrenList) return;
    childrenList.hidden = !childrenList.hidden;

    if (childrenList.hidden) {
        event.target.classList.add('hide');
        event.target.classList.remove('show');
    } else {
        event.target.classList.add('show');
        event.target.classList.remove('hide');
    }
}

// Sorting listeners
function sortListener(elements, prop) {
    elements.forEach(item => {
        item.addEventListener('click', event => {
            let order = event.target.value;
            removeClassFromElements(sortLabels, 'active');
            document.querySelector(`label[for="${event.target.id}"]`).classList.add('active');
            sortState = resetObjectValues(sortState);
            sortState[prop] = order;
            displayCards();
        });
    });
}

// Calculate pagination data
function pagination(posts, page, rows) {
    const trimStart = (page - 1) * rows;
    const trimEnd = trimStart + rows;

    const trimmedData = posts.slice(trimStart, trimEnd);

    const pages = Math.ceil(posts.length / rows);

    return {
        'currentPosts': trimmedData,
        'pages': pages
    };
}

// Show pagination
function createPaginationButtons(pages) {
    paginationContainer.innerHTML = '';

    let maxLeft = (currentPage - Math.floor(paginationActiveButtons / 2));
    let maxRight = (currentPage + Math.floor(paginationActiveButtons / 2));

    if (maxLeft < 1) {
        maxLeft = 1;
        maxRight = paginationActiveButtons;
    }

    if (maxRight > pages) {
        maxLeft = pages - (paginationActiveButtons - 1);
        maxRight = pages;
        if (maxLeft < 1) {
            maxLeft = 1;
        }
    }

    for (let page = maxLeft; page <= maxRight; page++) {
        createPaginationButton(page, page);
    }

    if (currentPage != 1) {
        createPaginationButton(1, '&#171; First');
    }

    if (currentPage != pages) {
        createPaginationButton(pages, 'Last &#187;');
    }

    paginationContainer.querySelector(`[data-value="${currentPage}"]`).classList.add('active');

}

// Create pagination buttons
function createPaginationButton(value, text) {
    let item = document.createElement('li');
    item.classList.add('page-item');
    item.setAttribute('data-value', value);
    item.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    value == 1 ? paginationContainer.prepend(item) : paginationContainer.append(item);

    item.addEventListener('click', function(e) {
        e.preventDefault();
        postsContainer.innerHTML = '';
        currentPage = Number(this.getAttribute('data-value'));
        displayCards();
    });
}

// Reset deleting and sorting cards
resetButton.addEventListener('click', () => {
    sortState = resetObjectValues(sortState);
    removeClassFromElements(sortLabels, 'active');
    displayCards('total');
});

// Helpers

// Go up function
let timeOut;
function goUp() {
    const top = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
    if(top > 0) {
        window.scrollBy(0,-100);
        timeOut = setTimeout(goUp(),20);
    } else clearTimeout(timeOut);
}

// Set display property
function setDisplay(element, prop) {
    element.style.display = prop;
}

function createTextElement(name, text, className) {
    const li = document.createElement(name);
    li.textContent = text;
    li.classList.add(className);

    return li;
}

// Group data by property
function groupByProp(data) {
    return data.reduce((r, a) => {
        r[a.category] = r[a.category] || [];
        r[a.category].push(a);
        return r;
    }, []);
}

// Create image
function createImage(src, className) {
    let image = document.createElement('img');
    image.classList.add(className);
    image.setAttribute('alt', '');
    image.setAttribute('src', src);

    return image;
} 

// Set all object values to null
function resetObjectValues(obj) {
    Object.keys(obj).forEach(i => obj[i] = null);
    return obj;
}

function addClass(element, className) {
    element.classList.add(className);
}

function removeClass(element, className) {
    element.classList.remove(className);
}

function removeClassFromElements(elements, className) {
    elements.forEach(item => item.classList.remove(className));
}

// ASC sorting
function sortAsc(elements, prop) {
    elements.sort((a, b) => {
        if (a[prop] < b[prop]) return -1;
        if (a[prop] > b[prop]) return 1;
        return 0;
    });
}

// DESC sorting
function sortDesc(elements, prop) {
    elements.sort((a, b) => {
        if (a[prop] > b[prop]) return -1;
        if (a[prop] < b[prop]) return 1;
        return 0;
    });
}

// Add id to post
function addIdsToPosts(posts) {
    posts.map((item, i) => {item.id = i;});
    return posts;
}

function showName(name) {
    return name.split('/')[1];
}

// Filesize
function bytesToSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
 }

// Timestamp to date
function timestampToDate(value) {
    const d = new Date();
    d.setTime(value);
    return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
}

// Update local storage
function updateLocalStorage(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}