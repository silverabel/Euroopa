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

    this.config = {
      questionMaxTime: 10,
    };

    // Custom neighbours
    this.customCountries = new Map();
    this.customCountries
      .set('norway', ['sweden', 'finland', 'russia', ])
      .set('sweden', ['norway', 'finland', 'denmark', ])
      .set('finland', ['norway', 'sweden', 'russia', 'estonia', ])
      .set('kazakhstan', ['russia'])
      .set('russia', ['norway', 'finland', 'estonia', 'latvia', 'belarus', 'ukraine', 'georgia', 'azerbaijan', 'kazakhstan', ]);
    
    this.state = {
      inventory: {
        vaccine: 1,
        drug: 1,
        ticket: 1,
      },
      score: {
        points: 0,
        time: 0,
      },
      level: 1,
      visitedCountriesCount: 0,
      questionTime: this.config.questionMaxTime,
      buffs: {
        vaccine: false,
        freepass: false,
      },
      wheelSectionNumber: 0,
    };

    this.getRandom = Phaser.Utils.Array.GetRandom;
  }

  preload() {
    this.load.svg('europe', 'images/europe.svg');

    for (const country of countriesArray) {
      this.load.svg(country.name, `images/countries/${country.name}.svg`);
    };

    this.load.svg('modal', 'images/modal.svg');
    this.load.svg('modalRound', 'images/modalRound.svg');

    this.load.svg('wheelGood', 'images/wheelGood.svg', { width: 986, height: 986 });
    this.load.svg('wheelBad', 'images/wheelBad.svg', { width: 986, height: 986 });
    this.load.svg('buttonSpin', 'images/buttonSpin.svg');

    this.load.svg('titlepage', 'images/titlepage.svg');
    this.load.svg('titlepageText', 'images/titlepageText.svg');
    this.load.svg('buttonStart', 'images/buttonStart.svg');
    this.load.svg('logo', 'images/logo.svg', { width: 450, height: 161 });
    this.load.svg('rules', 'images/rules.svg');

    this.load.svg('gameOverTextWin', 'images/gameOverTextWin.svg');
    this.load.svg('gameOverTextLose', 'images/gameOverTextLose.svg');
    this.load.svg('buttonNewGame', 'images/buttonNewGame.svg');

    this.load.svg('buttonMenu', 'images/buttonMenu.svg');
    this.load.svg('inventory', 'images/inventory.svg', { width: 145, height: 402 });
    this.load.svg('airplane', 'images/airplane.svg');

    this.load.svg('inventoryOverlay', 'images/inventoryOverlay.svg');

    this.load.audio('wheel', 'sounds/wheel.wav');
    this.load.audio('hover', 'sounds/hover.mp3');
    this.load.audio('question', 'sounds/question.wav');
    this.load.audio('gameLose', 'sounds/gameLose.wav');
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
          this.state.inventory.ticket--;
          this.updateInventory();
        }

        this.currentCountry = countryObject;
        this.setFill(countryObject, 'currentCountry');

        this.setCountryAndMenuInteractivity(false);

        if (this.state.buffs.freePass) {
          this.showPopup('vaba pääse, küsimusele ei pea vastama');
          
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
      }
      else {
        this.setFill(countryObject, 'country');
      }

      countryObject.visited = false;
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

    this.modalTime = this.add.text(960, 780, '', { font: '24px', align: 'center' }).setOrigin(0.5);
    this.modalTime.setTintFill(this.colorConfig.modalButton);

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
        this.handleQuestionAnswer(button.text == this.questionCorrectAnswer);
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

    this.wheelButton = this.add.image(960, 660, 'buttonSpin');
    this.wheelButton.visible = false;
    this.wheelButton.setInteractive();

    this.wheelButton.on('pointerover', () => {

    });

    this.wheelButton.on('pointerout', () => {

    });

    this.wheelButton.on('pointerdown', () => {
      this.wheelButton.visible = false;

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
    this.titlepageText = this.add.image(960, 610, 'titlepageText');
    this.buttonStart = this.add.image(960, 740, 'buttonStart');

    this.buttonRules = this.add.text(960, 830, 'Reeglid', { fill: '#C6CF14', font: '32px', align: 'center' }).setOrigin(0.5);
    this.buttonRules.setInteractive();
    this.buttonRules.on('pointerdown', () => {
      this.rules.visible = true;
    });

    this.buttonLeaderboard = this.add.text(960, 870, 'Edetabel', { fill: '#C6CF14', font: '32px', align: 'center' }).setOrigin(0.5);
    this.buttonLeaderboard.setInteractive();
    this.buttonLeaderboard.on('pointerdown', () => {
      this.fetchAndShowLeaderboard();
    });


    this.rules = this.add.image(960, 540, 'rules');
    this.rules.setInteractive();
    this.rules.visible = false;
    this.rules.on('pointerdown', () => {
      this.rules.visible = false;
    });

    this.buttonStart.setInteractive();
    this.buttonStart.on('pointerdown', () => {
      this.toggleMenu(false);
    });
    // Logo + titlepage end

    // Game over page
    this.gameOverScreen = {
      textWin: this.add.image(960, 610, 'gameOverTextWin'),
      textLose: this.add.image(960, 610, 'gameOverTextLose'),
      buttonNewGame: this.add.image(960, 740, 'buttonNewGame'),
    };
    
    this.gameOverScreen.buttonNewGame.on('pointerdown', () => {
      location.reload();
    });
    this.gameOverScreen.buttonNewGame.setInteractive();

    for (const key in this.gameOverScreen) {
      this.gameOverScreen[key].visible = false;
    }
    // Game over page end

    // Inventory

    const inventoryImagePosition = { x: 100, y: 760 }
    this.inventoryImage = this.add.image(inventoryImagePosition.x, inventoryImagePosition.y, 'inventory');
    
    this.drugCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y - 100, 
      this.state.inventory.drug, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.ticketCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y + 40, 
      this.state.inventory.ticket, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.vaccineCount = this.add.text(
      inventoryImagePosition.x + 50,
      inventoryImagePosition.y + 180, 
      this.state.inventory.vaccine, 
      { fill: 'black', font: '32px', align: 'center' }
    ).setOrigin(0.5);

    this.vaccineOverlay = this.add.image(inventoryImagePosition.x - 10, inventoryImagePosition.y + 130, 'inventoryOverlay');
    this.vaccineOverlay.setAlpha(0);
    this.vaccineOverlay.on('pointerdown', () => {
      this.state.buffs.vaccine = true;
      this.deactivateVaccineBlink();
      this.showPopup('Vaktsiin aktiveeritud');
      this.state.inventory.vaccine--;
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
      gameLose: this.sound.add('gameLose', { volume: 0.1 }),
    };
    this.sounds.question.loop = true;

    // Menu and score
    this.levelText = this.add.text(30, 430, 'Level: ' + this.state.level, { fill: 'black', font: '32px'});
    this.visitedCountriesCountText = this.add.text(30, 460, 'Külastatud riike: ' + this.state.visitedCountriesCount, { fill: 'black', font: '32px'});
    this.scorePoints = this.add.text(30, 490, 'Punktid: ' + this.state.score.points, { fill: 'black', font: '32px' });
    this.scoreTime = this.add.text(30, 520, 'Aeg: ' + this.state.score.time, { fill: 'black', font: '32px' });

    this.buttonMenu = this.add.image(134, 1000, 'buttonMenu');
    this.buttonMenu.on('pointerdown', () => this.toggleMenu(true));
    
    // Menu and score end

    // Leaderboard
    this.leaderboardModal = this.add.image(960, 540, 'modalRound');
    this.leaderboardTitle = this.add.text(960, 350, 'Edetabel', { fill: '#C6CF14', font: '64px' }).setOrigin(0.5);

    this.leaderboardHeaderName = this.add.text(640, 420, 'Nimi', { fill: '#C6CF14', font: '32px' }).setOrigin(0.5);
    this.leaderboardHeaderScore = this.add.text(960, 420, 'Punktid', { fill: '#C6CF14', font: '32px' }).setOrigin(0.5);
    this.leaderboardHeaderTime = this.add.text(1280, 420, 'Aeg', { fill: '#C6CF14', font: '32px' }).setOrigin(0.5);

    this.leaderboardModal.on('pointerdown', () => {
      this.setLeaderboardVisibility(false);
    });

    this.setLeaderboardVisibility(false);
    // Leaderboard end

    // Popup
    this.popup = this.add.rectangle(960, 540, 600, 300, 0xFFFFFF);
    this.popup.setStrokeStyle(4, 'black');
    this.popup.message = this.add.text(960, 540, 'Message', { fill: 'black', font: '32px', align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5);
    this.popup.visible = false;
    this.popup.message.visible = false;
    
    this.popup.setInteractive();
    this.popup.on('pointerdown', () => {
      this.popup.visible = false;
      this.popup.message.visible = false;
      this.popup.message.setText('');

      this.hidePreviousAndShowNext();
    });
    // Popup end
  }

  update() {
    if (this.wheelSpinning) {
      if (this.wheelSpeed > 0) {
        this.activeWheel.angle += this.wheelSpeed;
        this.wheelSpeed -= 0.1;

        if (Math.floor(this.activeWheel.angle / 60) !== this.state.wheelSectionNumber) this.sounds.wheel.play();
        this.state.wheelSectionNumber = Math.floor(this.activeWheel.angle / 60);
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
              if (this.state.inventory.drug < 1) {
                this.showPopup('Haigestusid viirusesse, mäng läbi!');
                return this.gameOver(false);
              }
              this.state.inventory.drug--;
            }
            break;
          case 1:
            if (this.activeWheel === this.wheelGood) {
              message = 'vaktsiin';
              this.state.inventory.vaccine++;
            }
            else {
              message = 'vaktsiin purunes';
              if (this.state.inventory.vaccine > 0) this.state.inventory.vaccine--;
            }
            break;
          case 2:
            message = this.activeWheel == this.wheelGood ? 'vaba pääse' : 'vaba pääse';
            if (this.activeWheel === this.wheelGood) {
              message = 'vaba pääse';
              this.state.buffs.freePass = true;
            }
            else {
              message = 'vaba pääse';
            }
            break;
          case -3:
            if (this.activeWheel === this.wheelGood) {
              message = '3x boonus';
              this.state.inventory.drug++;
              this.state.inventory.ticket++;
              this.state.inventory.vaccine++;
            }
            else {
              message = 'riik läheb lukku';
              this.lockdownRandomCountry();
            }
            break;
          case -2:
            if (this.activeWheel === this.wheelGood) {
              message = 'lennupilet';
              this.state.inventory.ticket++;
            }
            else {
              message = 'kaotasid lennupileti';
              if (this.state.inventory.ticket > 0) this.state.inventory.ticket--;
            }
            break;
          case -1:
            if (this.activeWheel === this.wheelGood) {
              message = 'ravim';
              this.state.inventory.drug++;
            }
            else {
              message = 'kaotasid ravimi';
              if (this.state.inventory.drug > 0) this.state.inventory.drug--;
            }
        }

        this.showPopup('Tulemus: ' + message);
        this.updateInventory();

        this.activeWheel.disableInteractive();
      } 
    }
  }

  handleQuestionAnswer(answerIsCorrect) {
    if (answerIsCorrect) {
      this.showPopup('Õige vastus');
      this.activeWheel = this.wheelGood;
    }
    else if (answerIsCorrect === false) {
      this.showPopup('Vale vastus');
      this.activeWheel = this.wheelBad;
    }
    else {
      this.showPopup('Aeg läbi! Pead keerutama halba ratast');
      this.activeWheel = this.wheelBad;
    }

    clearInterval(this.questionTimerInterval);
    this.deactivateVaccineBlink();

    this.sounds.question.stop();
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
    const response = await fetch(`api/question.php?country=${this.currentCountry.texture.key}`);
    const question = await response.json();

    this.startQuestionTimer();

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

  startQuestionTimer() {
    this.state.questionTime = Math.floor(this.config.questionMaxTime / this.state.level);
    this.modalTime.setText('Aeg: ' + this.state.questionTime);
    this.questionTimerInterval = setInterval(this.handleQuestionTimer.bind(this), 1000);
  }

  handleQuestionTimer() {
    this.state.questionTime--;
    this.modalTime.setText('Aeg: ' + this.state.questionTime);
    if (this.state.questionTime <= 0) {
      this.activeWheel = this.wheelBad;
      this.handleQuestionAnswer(null);
    }
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
    this.modalTime.visible = visibility;
  }

  setLeaderboardVisibility(visibility) {
    if (this.leaderboardElements && !visibility) this.leaderboardElements.forEach(element => element.destroy());

    this.leaderboardModal.visible = visibility;
    this.leaderboardTitle.visible = visibility;
    this.leaderboardHeaderName.visible = visibility;
    this.leaderboardHeaderScore.visible = visibility;
    this.leaderboardHeaderTime.visible = visibility;

    visibility ? this.leaderboardModal.setInteractive() : this.leaderboardModal.disableInteractive();
  }

  finishWheel() {
    const afterSpeed = 5;
    if (this.wheelSpeed < afterSpeed) return;
    this.activeWheel.angle += ((this.wheelSpeed - afterSpeed) ^ 2) * 10 / 2;
    this.wheelSpeed = afterSpeed;
  }

  setCountryAndMenuInteractivity(interactivity) {
    let interactiveCountryCount = 0;

    this.countries.children.iterate(country => {
      if (interactivity) {
        if (country.lockdownDuration > 0) {
          country.lockdownDuration--;
          this.removeLockdown(country);
        }

        if (country !== this.currentCountry &&
            country.lockdownDuration < 1 &&
            (this.state.inventory.ticket > 0 || this.checkNeighbours(country, this.currentCountry))
        ) {
          country.setInteractive();
          interactiveCountryCount++;
        }
      }
      else country.disableInteractive();
    });

    if (interactivity) this.buttonMenu.setInteractive();
    else this.buttonMenu.disableInteractive();

    if (interactivity && !interactiveCountryCount) return this.gameOver(false);
  }

  updateInventory() {
    this.drugCount.setText(this.state.inventory.drug);
    this.ticketCount.setText(this.state.inventory.ticket);
    this.vaccineCount.setText(this.state.inventory.vaccine);
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

  setWheelVisibility(visibility) {
    this.activeWheel.visible = visibility;
    this.wheelTriangle.visible = visibility;
    this.wheelButton.visible = visibility;

    this.activeWheel.angle = 0;
  }

  lockdownRandomCountry() {
    this.applyLockdown(this.getRandom(this.getNotCurrentCountries()));
  }

  getNotCurrentCountries() {
    return this.countries.getChildren().filter(country => country !== this.currentCountry);
  }
 
  gameOver(win, name) {
    if (this.activeWheel) this.setWheelVisibility(false);
    this.setCountryAndMenuInteractivity(false);
    clearInterval(this.timerInterval);

    if (win) this.gameOverScreen.textWin.visible = true; 
    else {
      if (!name) this.sounds.gameLose.play();
      this.gameOverScreen.textLose.visible = true;
    }

    this.gameOverScreen.buttonNewGame.visible = true;
    this.titlepage.visible = true;
    this.buttonLeaderboard.visible = true;

    if (!name) {
      setTimeout(() => {
        this.gameOver(win, prompt('Mäng läbi! Sisesta palun edetabeli jaoks enda nimi') || 'Ei taha nime panna');
      }, 50);

      return;
    }

    this.saveToLeaderboard(name);
  }

  applyLockdown(country) {
    country.lockdownDuration = 4;
    country.setTintFill(this.colorConfig.countryLockdown);
  }

  removeLockdown(country) {
    if (country.lockdownDuration > 0) return;

    if (country.visited) this.setFill(country, 'countryVisited');
    else this.setFill(country, 'country');
  }

  handleSpecialBonus() {
    const minValue = Math.min(this.state.inventory.drug, this.state.inventory.ticket, this.state.inventory.vaccine);
    let minValueArray = [];
    for (let key in this.state.inventory) {
      if (this.state.inventory[key] === minValue) minValueArray.push(key);
    }

    this.state.inventory[this.getRandom(minValueArray)]++;
  }

  handleCountrySuccess() {
    this.state.score.points += this.state.level;
    this.scorePoints.setText('Punktid: '+ this.state.score.points);

    this.currentCountry.visited = true;

    this.state.visitedCountriesCount++;
    this.visitedCountriesCountText.setText('Külastatud riike: ' + this.state.visitedCountriesCount);

    if (this.state.visitedCountriesCount >= 25 && this.state.level === 1) {
      this.state.level = 2;
      this.levelText.setText('Level: ' + this.state.level);
      this.showPopup('Level up!');
    }
  }

  activateVaccineBlink() {
    if (this.state.inventory.vaccine < 1) return;

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

  async saveToLeaderboard(name) {
    let extraPoints = 0;
    for (const key in this.state.inventory) extraPoints += this.state.inventory[key];
    this.showPopup(`Said esemete eest ${extraPoints} lisapunkti!`);
    this.state.score.points += extraPoints;
    this.updateInventory();

    const body = JSON.stringify({
      name,
      score: this.state.score.points,
      time: this.state.score.time,
    });
    const response = await fetch('api/leaderboard.php', { 
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body,
    });
    return await response.json();
  }

  async fetchAndShowLeaderboard() {
    const response = await fetch('api/leaderboard.php');
    this.showLeaderboard(await response.json());
  }

  showLeaderboard(leaderboard) {
    this.setLeaderboardVisibility(true);

    this.leaderboardElements = [];
    for (let i = 0; i < leaderboard.length; i++) {
      this.leaderboardElements.push(
        this.add.text(640, 460 + i * 30, leaderboard[i].name, { fill: '#C6CF14', font: '24px' }).setOrigin(0.5),
        this.add.text(960, 460 + i * 30, leaderboard[i].score, { fill: '#C6CF14', font: '24px' }).setOrigin(0.5),
        this.add.text(1280, 460 + i * 30, leaderboard[i].time, { fill: '#C6CF14', font: '24px' }).setOrigin(0.5)
      );
    }
  }

  showPopup(message) {
    this.popup.message.setText(message);
    this.popup.visible = true;
    this.popup.message.visible = true;
  }

  hidePreviousAndShowNext() {
    // Vaccine activated
    if (!this.activeWheel && this.state.buffs.vaccine) return;

    if (this.modalTitle.visible === true) {
      this.setModalVisibility(false);
      this.clearQuestion();

      if (this.activeWheel === this.wheelBad && this.state.buffs.vaccine) {
        this.showPopup('Vaktsiin aktiivne, halba ratast keerutama ei keerutama');
        this.setCountryAndMenuInteractivity(true);
      }
      else if (this.activeWheel === this.wheelGood && this.currentCountry.visited) {
        this.showPopup('Riik juba külastatud, head ratast uuesti keerutada ei saa');
        this.setCountryAndMenuInteractivity(true);
      }
      else {
        if (this.activeWheel === this.wheelGood) this.handleCountrySuccess();
        this.setWheelVisibility(true);
      }

      this.state.buffs.vaccine = false;

      return;
    }

    if (this.activeWheel && this.activeWheel.visible === true) {
      this.setWheelVisibility(false);
      this.activeWheel = null;

      if (this.state.visitedCountriesCount >= 50) {
        return this.gameOver(true);
      }

      this.setCountryAndMenuInteractivity(true);

      return;
    }

    if (this.state.buffs.freePass) {
      if (this.currentCountry.visited) {
        this.showPopup('Riik juba külastatud, head ratast uuesti keerutada ei saa');
        this.setCountryAndMenuInteractivity(true);
      } 
      else {
        this.handleCountrySuccess();
        this.activeWheel = this.wheelGood;
        this.setWheelVisibility(true);
        this.state.buffs.freePass = false;
      }
      
      return;
    }
  }

  toggleMenu(show) {
    this.titlepage.visible = show;
    this.titlepageText.visible = show;
    this.buttonStart.visible = show;
    this.buttonRules.visible = show;
    this.buttonLeaderboard.visible = show;

    this.setCountryAndMenuInteractivity(!show);

    if (!show) {
      this.timerInterval = setInterval(() => {
        this.state.score.time++;
        this.scoreTime.setText('Aeg: ' + this.state.score.time);
      }, 1000);
    }
    else {
      clearInterval(this.timerInterval)
    }
  }
}