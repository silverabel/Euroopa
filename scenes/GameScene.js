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

    this.countries = this.add.group();
    countriesArray.forEach(country => {
      let countryObject = this.add.image(country.x, country.y, country.name);
      this.countries.add(countryObject);
    });

    this.countries.children.iterate(country => country.setInteractive());

    this.input.on('gameobjectover', (pointer, object) => {
      object.setTint(0xbbbbbb);
    });

    this.input.on('gameobjectout', (pointer, object) => {
      object.clearTint();
    });

    this.input.on('gameobjectdown', (pointer, object) => {
      object.setTint(0x999999);
      setTimeout(() => object.setTint(0xbbbbbb), 100);
    });
  }
}