class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init() {
    this.colorConfig = {
      country: 0x0D4D82,
      currentCountry: 0xC7CF15,
      visitedCountry: 0x40AA78,
      countryHover: 0x7D8207,
      countryLockdown: 0xCF1B15,
      modalButton: 0x000000,
      modalButtonHover: 0x333333,
    };

    this.inventory = {
      vaccine: 1,
      drug: 1,
      ticket: 1,
    };

    this.score = {
      points: 0,
      time: 0,
    };

    this.level = 1;

    this.customCountries = new Map();
    this.customCountries
      .set('norway', ['sweden', 'finland', 'russia', ])
      .set('sweden', ['norway', 'finland', 'denmark', ])
      .set('finland', ['norway', 'sweden', 'russia', 'estonia', ])
      .set('kazakhstan', ['russia'])
      .set('russia', ['norway', 'finland', 'estonia', 'latvia', 'belarus', 'ukraine', 'georgia', 'azerbaijan', 'kazakhstan', ]);
    
    this.buffs = {
      vaccine: false,
      freepass: false,
    };

    this.getRandom = Phaser.Utils.Array.GetRandom;

    this.wheelSectionNumber = 0;
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
    this.load.svg('logo', 'images/logo.svg');
    this.load.svg('rules', 'images/rules.svg');

    this.load.svg('inventory', 'images/inventory.svg');
    this.load.svg('airplane', 'images/airplane.svg');

    this.load.svg('inventoryOverlay', 'images/inventoryOverlay.svg');

    this.load.audio('wheel', 'sounds/wheel.wav');
    this.load.audio('hover', 'sounds/hover.mp3');
    this.load.audio('question', 'sounds/question.wav');
  }
 
  create() {
    this.europe = this.add.image(960, 540, 'europe');

    this.countries = this.physics.add.group();
    for (const country of countriesArray) {
      const countryObject = this.physics.add.image(Number(country.x), Number(country.y), country.name);
      this.countries.add(countryObject);

      // Set country event listeners
      countryObject.on('pointerover', () => {
        if (!this.sounds.hover.isPlaying) 
          this.sounds.hover.play();

        this.setFill(countryObject, 'countryHover');

        if (!this.checkNeighbours(countryObject, this.currentCountry)) {

          if (countryObject.texture.key === 'norway') this.airplane.setPosition(610, 424);
          else if (countryObject.texture.key === 'sweden') this.airplane.setPosition(736, 307);
          else this.airplane.setPosition(countryObject.getCenter().x, countryObject.getCenter().y);
          this.airplane.visible = true;
        }
      });
  
      countryObject.on('pointerout', () => {
        if (countryObject === this.currentCountry) return;
        countryObject.visited ? this.setFill(countryObject, 'visitedCountry') : this.setFill(countryObject, 'country');

        this.airplane.visible = false;
      });
  
      countryObject.on('pointerdown', (pointer, x, y, event) => {
        this.currentCountry.visited ? this.setFill(this.currentCountry, 'visitedCountry') : this.setFill(this.currentCountry, 'country');

        this.airplane.visible = false;
        if (!this.checkNeighbours(countryObject, this.currentCountry)) {
          this.inventory.ticket--;
          this.updateInventory();
        }

        this.currentCountry = countryObject;
        this.setFill(countryObject, 'currentCountry');

        this.setCountryInteractivity(false);

        if (this.buffs.freePass) {
          alert('vaba pääse, küsimusele ei pea vastama');
          this.activeWheel = this.wheelGood;
          this.activateWheel();
          this.buffs.freePass = false;

          this.handleCountrySuccess();
          
          return;
        }

        this.fetchQuestion();
        this.openModal();

        this.activateVaccineBlink();
      });
      // Country event listeners end

      if (country.name === 'estonia') {
        this.currentCountry = countryObject;
        this.setFill(countryObject, 'currentCountry');
        countryObject.visited = true;
      }
      else {
        this.setFill(countryObject, 'country');
        countryObject.visited = false;
      }

      countryObject.lockdownDuration = 0;
    };

    // Modal start
    this.modal = this.add.image(960, 540, 'modal');
    this.modalTitle = this.add.text(960, 350, 'Küsimus', { fill: '#000000', font: '64px' }).setOrigin(0.5);
    this.modalQuestion = this.add.text(960, 540, '', { fill: '#000000', font: '32px', align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);

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
          this.handleCorrectAnswer();
        }
        else {
          alert('Vale vastus');
          this.activeWheel = this.wheelBad;
        }

        this.deactivateVaccineBlink();

        this.setModalVisibility(false);
        this.clearQuestion();

        this.sounds.question.stop();

        if (this.activeWheel === this.wheelBad && this.buffs.vaccine) {
          alert('Vaktsiin aktiivne, halba ratast keerutama ei keerutama');
          this.setCountryInteractivity(true);
        }
        else this.activateWheel();

        this.buffs.vaccine = false;
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
      this.wheelSpeed = Phaser.Math.Between(10, 30);
    });

    this.wheelGood.on('pointerdown', () => {
      this.finishWheel();
    });

    this.wheelBad.on('pointerdown', () => {
      this.finishWheel();
    });

    // Wheel end


    // Logo + Titlepage
    this.logo = this.add.image(240, 80, 'logo');
    this.titlepage = this.add.image(960, 540, 'titlepage');
    this.buttonStart = this.add.image(960, 740, 'buttonStart');

    this.buttonRules = this.add.text(960, 830, 'Reeglid', { fill: '#C6CF14', font: '32px', align: 'center' }).setOrigin(0.5);
    this.buttonRules.setInteractive();
    this.buttonRules.on('pointerdown', () => {
      this.rules.visible = true;
    });


    this.rules = this.add.image(960, 540, 'rules');
    this.rules.setInteractive();
    this.rules.visible = false;
    this.rules.on('pointerdown', () => {
      this.rules.visible = false;
    });

    this.buttonStart.setInteractive();
    this.buttonStart.on('pointerdown', () => {
      this.titlepage.visible = false;
      this.buttonStart.visible = false;
      this.buttonRules.visible = false;
      
      this.setCountryInteractivity(true);

      setInterval(() => {
        this.score.time++;
        this.scoreTime.setText('Aeg: ' + this.score.time);
      }, 1000);
    });

    // Inventory

    const inventoryImagePosition = { x: 100, y: 800 }
    this.inventoryImage = this.add.image(inventoryImagePosition.x, inventoryImagePosition.y, 'inventory');
    
    this.drugCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y - 100, 
      this.inventory.drug, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.ticketCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y + 40, 
      this.inventory.ticket, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.vaccineCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y + 180, 
      this.inventory.vaccine, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.vaccineOverlay = this.add.image(inventoryImagePosition.x - 10, inventoryImagePosition.y + 130, 'inventoryOverlay');
    this.vaccineOverlay.setAlpha(0);
    this.vaccineOverlay.on('pointerdown', () => {
      this.buffs.vaccine = true;
      this.deactivateVaccineBlink();
      alert('Vaktsiin aktiveeritud');
      this.inventory.vaccine--;
      this.updateInventory();
    });
  
    // Inventory end

    this.airplane = this.add.image(0, 0, 'airplane');
    this.airplane.setTintFill(0xFFFFFF);
    this.airplane.setScale(0.25);
    this.airplane.visible = false;

    this.sounds = {
      wheel: this.sound.add('wheel', { volume: 0.1 }),
      hover: this.sound.add('hover', { volume: 0.1 }),
      question: this.sound.add('question'),
    };
    this.sounds.question.loop = true;

    // Score
      this.scorePoints = this.add.text(30, 500, 'Punktid: ' + this.score.points, { fill: 'black', font: '32px' });
      this.scoreTime = this.add.text(30, 530, 'Aeg: ' + this.score.time, { fill: 'black', font: '32px' });
    // Score end
  }

  update() {
    if (this.wheelSpinning) {
      if (this.wheelSpeed > 0) {
        this.activeWheel.angle += this.wheelSpeed;
        this.wheelSpeed -= 0.1;

        if (Math.floor(this.activeWheel.angle / 60) !== this.wheelSectionNumber) this.sounds.wheel.play();
        this.wheelSectionNumber = Math.floor(this.activeWheel.angle / 60);
      }
      else {
        this.wheelSpinning = false;

        let winner = Math.floor(this.activeWheel.angle / 60);
        let message = '';
        switch (winner) {
          case 0:
            if (this.activeWheel === this.wheelGood) {
              message = 'special bonus';
              this.handleSpecialBonus();
            }
            else {
              message = 'haigestusid viirusse';
              if (this.inventory.drug < 1) return this.gameOver();
              this.inventory.drug--;
            }
            break;
          case 1:
            if (this.activeWheel === this.wheelGood) {
              message = 'vaktsiin';
              this.inventory.vaccine++;
            }
            else {
              message = 'vaktsiin purunes';
              if (this.inventory.vaccine > 0) this.inventory.vaccine--;
            }
            break;
          case 2:
            message = this.activeWheel == this.wheelGood ? 'vaba pääse' : 'vaba pääse';
            if (this.activeWheel === this.wheelGood) {
              message = 'vaba pääse';
              this.buffs.freePass = true;
            }
            else {
              message = 'vaba pääse';
            }
            break;
          case -3:
            if (this.activeWheel === this.wheelGood) {
              message = '3x boonus';
              this.inventory.drug++;
              this.inventory.ticket++;
              this.inventory.vaccine++;
            }
            else {
              message = 'riik läheb lukku';
              this.lockdownRandomCountry();
            }
            break;
          case -2:
            if (this.activeWheel === this.wheelGood) {
              message = 'lennupilet';
              this.inventory.ticket++;
            }
            else {
              message = 'kaotasid lennupileti';
              if (this.inventory.ticket > 0) this.inventory.ticket--;
            }
            break;
          case -1:
            if (this.activeWheel === this.wheelGood) {
              message = 'ravim';
              this.inventory.drug++;
            }
            else {
              message = 'kaotasid ravimi';
              if (this.inventory.drug > 0) this.inventory.drug--;
            }
        }

        alert('Tulemus: ' + message);
        this.updateInventory();

        this.activeWheel.angle = 0;
        this.activeWheel.visible = false;
        this.wheelTriangle.visible = false;

        this.activeWheel.disableInteractive();

        if (this.inventory.ticket < 1 && this.currentCountry.texture.key === 'iceland') return this.gameOver();

        this.setCountryInteractivity(true);
      } 
    }
  }

  setFill(object, colorCode) {
    object.setTintFill(this.colorConfig[colorCode]);
  }

  openModal() {
    this.sounds.question.play();

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

  setCountryInteractivity(interactivity) {
    let interactiveCountryCount = 0;

    this.countries.children.iterate(country => {
      if (interactivity) {
        if (country.lockdownDuration > 0) {
          country.lockdownDuration--;
          this.removeLockdown(country);
        }

        if (country !== this.currentCountry &&
            country.lockdownDuration < 1 &&
            (this.inventory.ticket > 0 || this.checkNeighbours(country, this.currentCountry))
        ) {
          country.setInteractive();
          interactiveCountryCount++;
        }
      }
      else country.disableInteractive();
    });

    if (interactivity && !interactiveCountryCount) return this.gameOver();
  }

  updateInventory() {
    this.drugCount.setText(this.inventory.drug);
    this.ticketCount.setText(this.inventory.ticket);
    this.vaccineCount.setText(this.inventory.vaccine);
  }

  checkNeighbours(country1, country2) {
    if (
      (country1.texture.key === 'ukraine' && country2.texture.key === 'serbia') || 
      (country1.texture.key === 'serbia' && country2.texture.key === 'ukraine'))
      return false;

    if (this.customCountries.has(country1.texture.key)) {
      if (this.customCountries.get(country1.texture.key).includes(country2.texture.key)) return true;
      return false;
    }

    if (this.customCountries.has(country2.texture.key)) {
      if (this.customCountries.get(country2.texture.key).includes(country1.texture.key)) return true;
      return false;
    }

    return this.physics.overlap(country1, country2) ? true : false;
  }

  activateWheel() {
    this.activeWheel.visible = true;
    this.wheelTriangle.visible = true;
    this.wheelButton.visible = true;
    this.wheelButton.setInteractive();
  }

  lockdownRandomCountry() {
    this.applyLockdown(this.getRandom(this.getNotCurrentCountries()));
  }

  getNotCurrentCountries() {
    return this.countries.getChildren().filter(country => country !== this.currentCountry);
  }
 
  gameOver() {
    alert('Mäng läbi :/(//(/');
  }

  applyLockdown(country) {
    country.lockdownDuration = 4;
    this.setFill(country, 'countryLockdown');
  }

  removeLockdown(country) {
    if (country.lockdownDuration > 0) return;

    if (country.visited) this.setFill(country, 'countryVisited');
    else this.setFill(country, 'country');
  }

  handleSpecialBonus() {
    const minValue = Math.min(this.inventory.drug, this.inventory.ticket, this.inventory.vaccine);
    let minValueArray = [];
    for (let key in this.inventory) {
      if (this.inventory[key] === minValue) minValueArray.push(key);
    }

    this.inventory[this.getRandom(minValueArray)]++;
  }

  handleCorrectAnswer() {
    alert('Õige vastus');
    this.activeWheel = this.wheelGood;

    this.handleCountrySuccess();
  }

  handleCountrySuccess() {
    this.score.points += this.level;
    this.scorePoints.setText('Punktid: '+ this.score.points);

    this.currentCountry.visited = true;
  }

  activateVaccineBlink() {
    if (this.inventory.vaccine < 1) return;

    this.vaccineOverlay.setInteractive();
    this.vaccineInterval = setInterval(this.blinkVaccine.bind(this), 100);
  }

  deactivateVaccineBlink() {
    clearInterval(this.vaccineInterval);
    this.vaccineOverlay.setAlpha(0);
    this.vaccineOverlay.disableInteractive();
  }

  blinkVaccine() {
    if (this.vaccineOverlay.alpha > 0.5) this.vaccineOverlay.setAlpha(0);

    this.vaccineOverlay.alpha += 0.1;
  }
}