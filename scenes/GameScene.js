class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.colorConfig = {
      currentCountry: 0xC7CF15,
      countryHover: 0x7D8207,
      country: 0x0D4D82,
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

    this.load.svg('wheelGood', 'images/wheelGood.svg');
  }
 
  create() {
    this.europe = this.add.image(960, 540, 'europe');

    this.countries = this.physics.add.group();
    for (const country of countriesArray) {
      const countryObject = this.physics.add.image(Number(country.x), Number(country.y), country.name);
      this.countries.add(countryObject);

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

      if (country.name === 'estonia') {
        this.currentCountry = countryObject;
        this.setFill(countryObject, 'currentCountry');
      }
      else {
        countryObject.setInteractive();
        Math.random() > 0.8 ? this.setFill(countryObject, 'countryLockdown')
                            : this.setFill(countryObject, 'country');
      }
    };
    
    // Modal start
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

    // Set modal buttons event listeners
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

        this.wheel.visible = true;
        this.wheelTriangle.visible = true;
        this.wheelButton.visible = true;
        this.wheelButton.setInteractive();
      });
    });
    // Modal buttons event listeners end
    // Modal end

    // Wheel start
    this.wheelSpinning = false;
    this.wheelSpeed = 0;

    this.wheel = this.add.image(960, 540, 'wheelGood');
    this.wheel.visible = false;

    this.wheelTriangle = this.add.triangle(960, 80, 0, 0, 100, 0, 50, 100, 0x000000);
    this.wheelTriangle.visible = false;

    this.wheelButton = this.add.text(960, 700, 'SPIN', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.wheelButton, 'modalButton');
    this.wheelButton.visible = false;
    this.wheelButton.on('pointerover', () => {

    });
    this.wheelButton.on('pointerout', () => {

    });
    this.wheelButton.on('pointerdown', () => {
      this.wheelButton.visible = false;
      this.wheelButton.disableInteractive();

      this.wheelSpinning = true;
      this.wheelSpeed = Phaser.Math.Between(10, 40);
    });

    





    // Wheel end
  }

  update() {
    if (this.wheelSpinning) {
      if (this.wheelSpeed > 0) {
        this.wheel.angle += this.wheelSpeed;
        this.wheelSpeed -= 0.1;
      }
      else {
        this.wheelSpinning = false;


        let winner = Math.floor(this.wheel.angle / 60);
        console.log(winner)
        let message = '';
        switch (winner) {
          case 0:
            message = '3x boonus';
            break;
          case 1:
            message = 'vaktsiin';
            break;
          case 2:
            message = 'vaba pääse';
            break;
          case -3:
            message = 'boonuse valik';
            break;
          case -2:
            message = 'lennupilet';
            break;
          case -1:
            message = 'ravim';
        }

        alert('Võitsid: ' + message);

        this.wheel.angle = 0;
        this.wheel.visible = false;
        this.wheelTriangle.visible = false;

        this.countries.children.iterate(country => {
          if (country !== this.currentCountry) country.setInteractive();
        });
      }

      
    }

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