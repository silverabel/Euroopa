class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.colorConfig = {
      currentCountry: 0xffffff,
      neighbourCountryHover: 0xbbbbbb,
      country: 0x888888,
    }
  }

  preload() {
    this.load.image('europe', 'images/europe.png');

    for (const country of countriesArray) {
      this.load.image(country.name, `images/countries/${country.name}.png`);
    };
  }
 
  create() {
    this.europe = this.add.image(1920, 0, 'europe').setOrigin(1, 0);

    this.countries = this.physics.add.group();
    for (const country of countriesArray) {
      let countryObject = this.physics.add.image(Number(country.x), Number(country.y), country.name);
      this.countries.add(countryObject);
      countryObject.setTintFill(this.colorConfig.country);

      if (country.name === 'estonia') this.currentCountry = countryObject;
    };

    this.setColor(this.currentCountry, 'currentCountry');
    this.setOnlyNeighboursInteractive();

    this.input.on('gameobjectover', (pointer, object) => {
      if (object !== this.currentCountry) this.setColor(object, 'neighbourCountryHover');
    });

    this.input.on('gameobjectout', (pointer, object) => {
      if (object !== this.currentCountry) this.setColor(object, 'country');
    });

    this.input.on('gameobjectdown', (pointer, object) => {
      this.setColor(object, 'currentCountry');
      this.setColor(this.currentCountry, 'country');
      this.currentCountry = object;

      this.setOnlyNeighboursInteractive();
    });
  }

  update() {

  }

  setOnlyNeighboursInteractive() {
    this.countries.children.iterate(country => {
      country.disableInteractive();
      if (this.physics.overlap(country, this.currentCountry)) country.setInteractive();
    });
  }

  setColor(object, color) {
    object.setTintFill(this.colorConfig[color]);
  }
}