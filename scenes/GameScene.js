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
    this.load.svg('europe', 'images/europe.svg');

    for (const country of countriesArray) {
      this.load.svg(country.name, `images/countries/${country.name}.svg`);
    };
  }
 
  create() {
    this.europe = this.add.image(960, 540, 'europe');

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