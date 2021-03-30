class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.colorConfig = {
      currentCountry: 0x0D4D82,
      countryHover: 0x7D8207,
      country: 0xC7CF15,
      modalButton: 0x000000,
      modalButtonHover: 0x333333,
      countryLockdown: 0xCF1B15,
    }
  }

  preload() {
    this.load.svg('europe', 'images/europe.svg');

    for (const country of countriesArray) {
      this.load.svg(country.name, `images/countries/${country.name}.svg`);
    };

    this.load.svg('modal', 'images/modal.svg');
  }
 
  create() {
    this.europe = this.add.image(960, 540, 'europe');

    this.countries = this.physics.add.group();
    for (const country of countriesArray) {
      const countryObject = this.physics.add.image(Number(country.x), Number(country.y), country.name);
      this.countries.add(countryObject);
      Math.random() > 0.8 ? this.setFill(countryObject, 'countryLockdown')
                          : this.setFill(countryObject, 'country');

      // Set country event listeners
      countryObject.on('pointerover', () => {
        this.setFill(countryObject, 'countryHover');
      });
  
      countryObject.on('pointerout', () => {
        if (countryObject !== this.currentCountry) this.setFill(countryObject, 'country');
      });
  
      countryObject.on('pointerdown', (pointer, x, y, event) => {
        this.setFill(countryObject, 'currentCountry');
        this.setFill(this.currentCountry, 'country');
        this.currentCountry = countryObject;

        this.countries.children.iterate(country => {
          country.disableInteractive();
        });

        this.openModal();
      });
      // Country event listeners end

      countryObject.setInteractive();

      if (country.name === 'estonia') this.currentCountry = countryObject;
    };
    this.setFill(this.currentCountry, 'currentCountry');

    this.modal = this.add.image(960, 540, 'modal');
    this.modal.visible = false;
    this.modalTitle = this.add.text(960, 350, 'Küsimus', { fill: '#000000', font: '64px' }).setOrigin(0.5);
    this.modalTitle.visible = false;
    this.modalQuestion = this.add.text(960, 540, '', { fill: '#000000', font: '32px' }).setOrigin(0.5);
    this.modalQuestion.visible = false;

    this.modalButton1 = this.add.text(640, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButton1, 'modalButton');
    this.modalButton1.visible = false;
    this.modalButton2 = this.add.text(960, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButton2, 'modalButton');
    this.modalButton2.visible = false;
    this.modalButton3 = this.add.text(1280, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButton3, 'modalButton');
    this.modalButton3.visible = false;

    // Set modal button event listeners
    this.modalButtons = this.add.group([this.modalButton1, this.modalButton2, this.modalButton3]);
    this.modalButtons.children.iterate(button => {
      button.on('pointerover', () => {
        this.setFill(button, 'modalButtonHover');
      });
  
      button.on('pointerout', () => {
        this.setFill(button, 'modalButton');
      });
  
      button.on('pointerdown', () => {
        this.modal.visible = false;
        this.modalTitle.visible = false;
        this.modalQuestion.visible = false;
        this.modalButton1.visible = false;
        this.modalButton2.visible = false;
        this.modalButton3.visible = false;

        this.countries.children.iterate(country => {
          if (country !== this.currentCountry) country.setInteractive();
        });
      });
    });
    // Modal button event listeners end
  }

  update() {

  }

  setOnlyNeighboursInteractive() {
    this.countries.children.iterate(country => {
      country.disableInteractive();
      if (this.physics.overlap(country, this.currentCountry)) country.setInteractive();
    });
    this.currentCountry.setInteractive();
  }

  setFill(object, color) {
    object.setTintFill(this.colorConfig[color]);
  }

  openModal() {
    this.modal.visible = true;
    this.modalTitle.visible = true;
    this.modalQuestion.visible = true;
    this.modalQuestion.setText('Kes täidab Andorras riigipea funktsiooni?');
    this.modalButton1.visible = true;
    this.modalButton1.setText('Kaks välismaa ametikandjat').setInteractive();
    this.modalButton2.visible = true;
    this.modalButton2.setText('President').setInteractive();
    this.modalButton3.visible = true;
    this.modalButton3.setText('Kuningas').setInteractive();
  }
}