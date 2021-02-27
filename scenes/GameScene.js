class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    countriesArray = [
      {
        name: 'estonia',
        x: 569.4,
        y: 214.4
      },
      {
        name: 'latvia',
        x: 563.1,
        y: 260.1
      },
      {
        name: 'austria',
        x: 390.5,
        y: 476.5
      },
      {
        name: 'lithuania',
        x: 548.1,
        y: 303.9
      },
    ];
  }

  preload() {
    this.load.image('europe', 'images/europe.png');

    countriesArray.forEach(country => {
      this.load.image(country.name, `images/countries/${country.name}.png`);
    });
  }
 
  create() {
    this.europe = this.add.image(400, 300, 'europe');

    this.countries = this.physics.add.group();
    countriesArray.forEach(country => {
      let countryObject = this.physics.add.image(country.x, country.y, country.name);
      this.countries.add(countryObject);

      if (country.name === 'estonia') this.currentCountry = countryObject;
    });

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