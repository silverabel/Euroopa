class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('europe', 'images/europe.png');

    for (const country of countriesArray) {
      this.load.image(country.name, `images/countries/${country.name}.png`);
    };
  }
 
  create() {
    this.europe = this.add.image(400, 300, 'europe');

    this.countries = this.physics.add.group();
    for (const country of countriesArray) {
      let countryObject = this.physics.add.image(Number(country.x), Number(country.y), country.name);
      this.countries.add(countryObject);

      if (country.name === 'estonia') this.currentCountry = countryObject;
    };

    this.currentCountry.setTint(0x999999);
    this.setOnlyNeighboursInteractive();

    this.input.on('gameobjectover', (pointer, object) => {
      if (object !== this.currentCountry) object.setTint(0xbbbbbb);
    });

    this.input.on('gameobjectout', (pointer, object) => {
      if (object !== this.currentCountry) object.clearTint();
    });

    this.input.on('gameobjectdown', (pointer, object) => {
      object.setTint(0x999999);
      this.currentCountry.clearTint();
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
}