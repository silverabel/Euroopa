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
    this.load.svg('wheelBad', 'images/wheelBad.svg');

    this.load.svg('titlepage', 'images/titlepage.svg');
    this.load.svg('buttonStart', 'images/buttonStart.svg');
    this.load.svg('buttonRules', 'images/buttonRules.svg');
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

        this.fetchQuestion();
        this.openModal();
      });
      // Country event listeners end

      if (country.name === 'estonia') {
        this.currentCountry = countryObject;
        this.setFill(countryObject, 'currentCountry');
      }
      else {
        Math.random() > 0.8 ? this.setFill(countryObject, 'countryLockdown')
                            : this.setFill(countryObject, 'country');
      }
    };
    
    // Modal start
    this.modal = this.add.image(960, 540, 'modal');
    this.modalTitle = this.add.text(960, 350, 'Küsimus', { fill: '#000000', font: '64px' }).setOrigin(0.5);
    this.modalQuestion = this.add.text(960, 540, '', { fill: '#000000', font: '32px' }).setOrigin(0.5);

    this.modalButtonA = this.add.text(640, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButtonA, 'modalButton');
    this.modalButtonB = this.add.text(960, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButtonB, 'modalButton');
    this.modalButtonC = this.add.text(1280, 700, '', { font: '32px', align: 'center', wordWrap: { width: 160 } }).setOrigin(0.5);
    this.setFill(this.modalButtonC, 'modalButton');

    this.setModalVisibility(false);

    // Set modal buttons event listeners
    this.modalButtons = this.add.group([this.modalButtonA, this.modalButtonB, this.modalButtonC]);
    this.modalButtons.children.iterate(button => {
      button.on('pointerover', () => {
        this.setFill(button, 'modalButtonHover');
      });
  
      button.on('pointerout', () => {
        this.setFill(button, 'modalButton');
      });
  
      button.on('pointerdown', () => {
        if (button.text == this.questionCorrectAnswer) {
          alert('Õige vastus');
          this.activeWheel = this.wheelGood;
        }
        else {
          alert('Vale vastus');
          this.activeWheel = this.wheelBad;
        }

        this.setModalVisibility(false);
        this.clearQuestion();

        this.activeWheel.visible = true;
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

    this.wheelGood = this.add.image(960, 540, 'wheelGood');
    this.wheelGood.visible = false;

    this.wheelBad = this.add.image(960, 540, 'wheelBad');
    this.wheelBad.visible = false;

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

      this.activeWheel.setInteractive();

      this.wheelSpinning = true;
      this.wheelSpeed = Phaser.Math.Between(10, 40);
    });

    this.wheelGood.on('pointerdown', () => {
      this.finishWheel();
    });

    this.wheelBad.on('pointerdown', () => {
      this.finishWheel();
    });

    // Wheel end


    // Titlepage
    
    this.titlepage = this.add.image(960, 540, 'titlepage');
    this.buttonStart = this.add.image(960, 740, 'buttonStart');
    this.buttonRules = this.add.image(960, 850, 'buttonRules');

    this.buttonStart.setInteractive();
    this.buttonStart.on('pointerdown', () => {
      this.titlepage.visible = false;
      this.buttonStart.visible = false;
      this.buttonRules.visible = false;
      this.countries.children.iterate(country => {
        if (country !== this.currentCountry) country.setInteractive();
      });
    });
  }

  update() {
    if (this.wheelSpinning) {
      if (this.wheelSpeed > 0) {
        this.activeWheel.angle += this.wheelSpeed;
        this.wheelSpeed -= 0.1;
      }
      else {
        this.wheelSpinning = false;

        let winner = Math.floor(this.activeWheel.angle / 60);
        let message = '';
        switch (winner) {
          case 0:
            message = this.activeWheel == this.wheelGood ? '3x boonus' : 'haigestusid viirusse';
            break;
          case 1:
            message = this.activeWheel == this.wheelGood ? 'vaktsiin' : 'vaktsiin purunes';
            break;
          case 2:
            message = this.activeWheel == this.wheelGood ? 'vaba pääse' : 'vaba pääse';
            break;
          case -3:
            message = this.activeWheel == this.wheelGood ? 'boonuse valik' : 'riik läheb lukku';
            break;
          case -2:
            message = this.activeWheel == this.wheelGood ? 'lennupilet' : 'kaotasid lennupileti';
            break;
          case -1:
            message = this.activeWheel == this.wheelGood ? 'ravim' : 'kaotasid ravimi';
        }

        alert('Tulemus: ' + message);

        this.activeWheel.angle = 0;
        this.activeWheel.visible = false;
        this.wheelTriangle.visible = false;

        this.activeWheel.disableInteractive();

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

  setFill(object, colorCode) {
    object.setTintFill(this.colorConfig[colorCode]);
  }

  openModal() {
    this.setModalVisibility(true);
    this.modalButtonA.setInteractive();
    this.modalButtonB.setInteractive();
    this.modalButtonC.setInteractive();
  }

  async fetchQuestion() {
    this.modalQuestion.setText('Küsimuse laadimine...');
    let response = await fetch(`api/api.php?country=${this.currentCountry.texture.key}`);
    let question = await response.json();

    if (question.name) {
      this.modalQuestion.setText(question.name);
      this.modalButtonA.setText(question.a);
      this.modalButtonB.setText(question.b);
      this.modalButtonC.setText(question.c);
      this.questionCorrectAnswer = question[question.correct.toLowerCase()];
      return;
    }

    this.modalQuestion.setText('Random question');
    this.modalButtonA.setText('Õige');
    this.modalButtonB.setText('Vale');
    this.modalButtonC.setText('Vale');
    this.questionCorrectAnswer = 'Õige';
  }

  clearQuestion() {
    this.modalQuestion.setText('');
    this.modalButtonA.setText('');
    this.modalButtonB.setText('');
    this.modalButtonC.setText('');
  }

  setModalVisibility(visibility) {
    this.modal.visible = visibility;
    this.modalTitle.visible = visibility;
    this.modalQuestion.visible = visibility;
    this.modalButtonA.visible = visibility;
    this.modalButtonB.visible = visibility;
    this.modalButtonC.visible = visibility;
  }

  finishWheel() {
    const afterSpeed = 5;
    if (this.wheelSpeed < afterSpeed) return;
    this.activeWheel.angle += ((this.wheelSpeed - afterSpeed) ^ 2) * 10 / 2;
    this.wheelSpeed = afterSpeed;
  }
}