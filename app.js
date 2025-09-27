const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Express setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper: assemble ingredient list from API cocktail object
function extractIngredients(drink) {
  const ingredients = [];
  for (let i = 1; i <= 15; i++) {
    const ing = drink[`strIngredient${i}`];
    const measure = drink[`strMeasure${i}`];
    if (ing && ing.trim() !== '') {
      ingredients.push({
        ingredient: ing,
        measure: measure ? measure.trim() : ''
      });
    }
  }
  return ingredients;
}

// GET / -> form
app.get('/', (req, res) => {
  res.render('index');
});

// POST /search -> search by cocktail name
app.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query || query.trim() === '') {
    return res.render('error', { message: 'Please enter a cocktail name to search.' });
  }
  try {
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query.trim())}`;
    const response = await axios.get(apiUrl);
    const data = response.data;
    if (!data || !data.drinks) {
      return res.render('error', { message: `No cocktails found for "${query}". Try another name.` });
    }
    // pass array of cocktails to template
    const drinks = data.drinks.map(drink => ({
      id: drink.idDrink,
      name: drink.strDrink,
      category: drink.strCategory,
      alcoholic: drink.strAlcoholic,
      glass: drink.strGlass,
      instructions: drink.strInstructions,
      thumbnail: drink.strDrinkThumb,
      ingredients: extractIngredients(drink)
    }));
    res.render('result', { cocktails: drinks, title: `Results for "${query}"` });
  } catch (err) {
    console.error(err.message || err);
    res.render('error', { message: 'Error fetching data from the Cocktail API. Try again later.' });
  }
});

// GET /random -> random cocktail
app.get('/random', async (req, res) => {
  try {
    const apiUrl = `https://www.thecocktaildb.com/api/json/v1/1/random.php`;
    const response = await axios.get(apiUrl);
    const drink = response.data.drinks && response.data.drinks[0];
    if (!drink) return res.render('error', { message: 'No cocktail returned. Try again.' });

    const cocktail = {
      id: drink.idDrink,
      name: drink.strDrink,
      category: drink.strCategory,
      alcoholic: drink.strAlcoholic,
      glass: drink.strGlass,
      instructions: drink.strInstructions,
      thumbnail: drink.strDrinkThumb,
      ingredients: extractIngredients(drink)
    };

    res.render('result', { cocktails: [cocktail], title: 'Random Cocktail' });
  } catch (err) {
    console.error(err);
    res.render('error', { message: 'Error fetching random cocktail.' });
  }
});

// optional about
app.get('/about', (req, res) => res.render('about'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found.' });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
