import Name from './components/name';

const paragraph = document.createElement('p');

paragraph.textContent = Name.sayName('Horizon');

document.querySelector('body').appendChild(paragraph);
