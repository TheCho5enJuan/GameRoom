'use strict';
const cards=[...document.querySelectorAll('.card')];
const filters=[...document.querySelectorAll('.filter')];
const search=document.getElementById('search');
const empty=document.getElementById('empty');
let current='all';
function applyFilters(){
  const query=search.value.trim().toLowerCase();
  let visible=0;
  cards.forEach(card=>{
    const matchesFilter=current==='all'||card.dataset.filter===current;
    const matchesText=!query||card.dataset.name.includes(query)||card.textContent.toLowerCase().includes(query);
    const show=matchesFilter&&matchesText;
    card.classList.toggle('hide',!show);
    if(show)visible++;
  });
  empty.classList.toggle('show',visible===0);
}
filters.forEach(button=>button.addEventListener('click',()=>{
  filters.forEach(item=>item.classList.remove('active'));
  button.classList.add('active');
  current=button.dataset.filter;
  applyFilters();
}));
search.addEventListener('input',applyFilters);
