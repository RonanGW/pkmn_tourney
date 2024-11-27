import { useState, useEffect } from 'react'
import { MultiSelect } from 'primereact/multiselect';
import './Gallery.css'
import CharCard from './TrainerPage/CharCard'
import MonCard from './MonPage/MonCard'
//Interface to pass state variables created by parent object
interface Gallery {
  menu: any[] // passes the current state (i.e. gallery menu) to this page so it can be undone. Value is [state<string>,setState()]
  trainers: any[] // Current trainer data for populating most up to date character info. Value is [state<trainer>,setState()]
}

// Generic data structure for a 'mon'
interface mon {
  name: string, //The mon's name
  form: string, //The mon's from ("" if none)
  shine:string, //The mon's shine ("" if none)
  state: string; //The state of this mon for this trainer, (i.e. Unlocked, Locked or Hidden)
  lvl: number; //The mon's current level
  xp: number; //The mon's current xp prior to leveling. (Cap is their current level which will let them level up)
  hp: number; //The mon's current total HP
  atk: number; //Unused for now. Currently damage is just equal to mon's level
  //cost: number; //How many BP it costs to purchase this mon once it goes from 'hidden' to 'locked'
}

// Generic data structure for a 'trainer'
interface trainer {
  name: string; //The display name of the trainer
  state: string; //The state of this trainer, (i.e. Unlocked, Locked or Hidden)
  starter: string; //The active starting mon of the trainer
  region: string; //Home region of this trainer. (Used primarily for sorting)
  class: string; //This trainer's class. (Used primarily for sorting)
  w: number; //Total number of tourney wins for this trainer
  l: number; //Total number of tourney losses for this trainer
  BP: number; //Available BP for this trainer (Game Currency)
  mons: object //Object containing all mon data for this trainer
};

let renderTrainers = false //Representation of current render
let renderMons = false //Representation of current render
let dex: any = {}
fetch('/dex.json').then(response => {return response.json()}).then(tmp => dex = tmp)

// Gallery Menu
function Gallery({menu, trainers}: Gallery) {
  const trainerObjects: [string,trainer][]  = Object.entries(trainers[0]) // Trainer data as an array
  const regions = [...new Set([...new Set(trainerObjects.map(item => item[1].region))].map(item => Object.create({value: item, label: item, name: item})))];
  const classes = [...new Set([...new Set(trainerObjects.map(item => item[1].class))].map(item => Object.create({value: item, label: item, name: item})))];
  const types = [
    { value: 'Bug', label: 'Bug', name: 'Bug'},
    { value: 'Dark', label: 'Dark', name: 'Dark'},
    { value: 'Dragon', label: 'Dragon', name: 'Dragon'},
    { value: 'Electric', label: 'Electric', name: 'Electric'},
    { value: 'Fairy', label: 'Fairy', name: 'Fairy'},
    { value: 'Fighting', label: 'Fighting', name: 'Fighting'},
    { value: 'Fire', label: 'Fire', name: 'Fire'},
    { value: 'Flying', label: 'Flying', name: 'Flying'},
    { value: 'Ghost', label: 'Ghost', name: 'Ghost'},
    { value: 'Grass', label: 'Grass', name: 'Grass'},
    { value: 'Ground', label: 'Ground', name: 'Ground'},
    { value: 'Ice', label: 'Ice', name: 'Ice'},
    { value: 'Normal', label: 'Normal', name: 'Normal'},
    { value: 'Null', label: 'Null', name: 'Null'},
    { value: 'Poison', label: 'Poison', name: 'Poison'},
    { value: 'Psychic', label: 'Psychic', name: 'Psychic'},
    { value: 'Rock', label: 'Rock', name: 'Rock'},
    { value: 'Steel', label: 'Steel', name: 'Steel'},
    { value: 'Water', label: 'Water', name: 'Water'},
  ];
  const shines = [
    { value: '', label: '', name: ''},
    { value: 'Shiny', label: 'Shiny', name: 'Shiny'},
    { value: 'Albino', label: 'Albino', name: 'Albino'},
    { value: 'Melanistic', label: 'Melanistic', name: 'Melanistic'},
  ]
  const states = [
    { value: 'Unlocked', label: 'Unlocked', name: 'Unlocked'},
    { value: 'Available', label: 'Available', name: 'Available'},
    { value: 'Locked', label: 'Locked', name: 'Locked'}
  ]

    const [selectedRegions, setSelectedRegions] = useState(regions.map((r) => r.value));
    const [selectedClasses, setSelectedClasses] = useState(classes.map((c) => c.value));
    const [selectedTypes, setSelectedTypes] = useState(types.map((t) => t.value));
    const [selectedShines, setSelectedShines] = useState(shines.map((t) => t.value));
    const [selectedStates, setSelectedStates] = useState(["Unlocked"]); // Actively displayed trainer & mon statuses
    const [cards, setCards] = useState(filterTrainerCards()); // Currently display "Cards"
    const [currTrainer, setCurrTrainer] = useState(trainers[0]["red"]); //Current trainer to display
    const [selectedMon, setSelectedMon] = useState({name:"mon",form:"none",shine:"none",state:"blank",lvl:0,xp:0,hp:0,atk:0,cost:999}) //Current Mon to display inside trainer screen

    //This useEffect is set to re-render manually when the trigger is set to true
    //Also functions as a primary debugging function for seeing the most up to date changes
    useEffect(() => {
      // Update the document title using the browser API

      if (renderTrainers) {
          setCards(filterTrainerCards())
          renderTrainers = false
      }
      else if (renderMons) {
        setCards(filterMonCards(currTrainer))
        renderMons = false
      }
    });

    


  // Reset's the display to the starting Gallery Screen
  function switchToMainScreen() {
    menu[1]("Gallery"); //setMenu function for the menu state defined & passed by parent object
    setSelectedMon({name:"mon",form:"none",shine:"none",state:"blank",lvl:0,xp:0,hp:0,atk:0,cost:999})
    setCards(filterTrainerCards());
  }

  // Resets the display to the selected trainer's details page
  function switchToTrainerScreen(trainer: any) {
    menu[1]("Gallery-Trainer"); //setMenu function for the menu state defined & passed by parent object
    setCurrTrainer(trainer)
    setCards(filterMonCards(trainer));
  }

  // Resets the display to the selected mon's details page
  function switchToMonScreen(mon: mon) {
    menu[1]("Mon"); //setMenu function for the menu state defined & passed by parent object
  }

  // Returns an array of Trainer Cards to display using currently selected Filters
  function filterTrainerCards(): JSX.Element[] {
    let newCards: JSX.Element[] = []; //Array to be filled with cards
    
    //Loop through each trainer and if their status is active, create a card for them and add it to the display list.
    for (let [tkey,value] of trainerObjects) {
      selectedStates.includes(value.state) && selectedRegions.includes(value.region) && selectedClasses.includes(value.class)? newCards.push(
        <div key={Math.random()} onClick={() => switchToTrainerScreen(value)}>
            <CharCard trainer={value}></CharCard>
        </div>
      ) : <></>
    }
    return newCards
  }

  // Returns an array of Mon Cards to display using currently selected Filters
  function filterMonCards(trainer: any): JSX.Element[] {
    let trainerData: any
    fetch('/Savedata/'+trainer.name+'.json')
      .then(response => {return response.json()})
        .then((tmp) => {
          trainerData = tmp
        });

        let newCards: JSX.Element[] = []; //Array to be filled with cards

        const timeoutId = window.setTimeout(() => {
          console.log(trainerData)
          let mons = Object.entries<any>(trainerData.mons); //Turns the passed trainers mons object into an array
          //Loop through each mon and if their status is active, create a card for them and add it to the display list.
          for (let [tkey,value] of mons) {
            //console.log(value.name + value.form + ": " + dex.mons[value.name + value.form].region)
            // && selectedRegions.includes(dex.mons[value.name + value.form].region) && (selectedTypes.includes(dex.mons[value.name + value.form].type1) || selectedTypes.includes(dex.mons[value.name + value.form].type2))
              selectedStates.includes(value.state) && selectedShines.includes(value.shine) && selectedRegions.includes(dex.mons[value.name + value.form].region) && (selectedTypes.includes(dex.mons[value.name + value.form].type1) || selectedTypes.includes(dex.mons[value.name + value.form].type2))? newCards.push(
                <div onClick={() => {setSelectedMon(value)}}>
                    <MonCard mon={value}></MonCard>
                </div>
              ) : <></>
            }
            setSelectedMon({name:"mon",form:"none",shine:"none",state:"blank",lvl:0,xp:0,hp:0,atk:0,cost:999})
        }, 500)

      return newCards
  }

  //Unlocks an availabe mon for a given trainer in exchange for BP
  function purchaseMon(trainer: trainer, mon: mon): void {
      if (trainer.BP >= dex.mons[mon.name + mon.form].cost) {
        mon.state="Unlocked"
        trainer.BP = trainer.BP - dex.mons[mon.name + mon.form].cost
        setCards(filterMonCards(trainer))
      }
  }

  //Sets the object to display the 'Trainer Page' content, which is the trainer selected, their details and all the mons they have that are unlocked or available next
  //Also allows the user to open a display revealing the details of each of their mons
  function TrainerPage(trainer: trainer): JSX.Element {

    return <div className="Gallery-content">
            <div className="Gallery-vertical-panel">
                <CharCard trainer={trainer}></CharCard>
                <div className="Gallery-info-panel">
                    {trainer.state == "Unlocked" ? 
                        <div>
                            <p>Region: {trainer.region}</p>
                            <p>Trainer Class: {trainer.class}</p>
                            <p>Wins: {trainer.w}</p>
                            <p>Losses: {trainer.l}</p>
                            <p>BP: {trainer.BP}</p>
                        </div> :
                        <p>Play a round to unlock the next trainer!</p>
                    }
                </div>
            </div>
            <div className="Gallery-vertical-panel">
                {selectedMon.state == "blank" ? "" : 
                    <div>
                        <MonCard mon={selectedMon}></MonCard>
                        <div className="Gallery-info-panel">
                            { selectedMon.state == "Unlocked" ?
                            <div>
                                <p>Level: {selectedMon.lvl}</p>
                                <p>XP: {selectedMon.xp}</p>
                                <p>HP: {selectedMon.hp}</p>
                                <p>Atk: {selectedMon.atk}</p>
                            </div> :
                            selectedMon.state == "Available" ?
                                <button onClick={() => {purchaseMon(trainer, selectedMon)}}>Purchase for {selectedMon.cost}BP</button> :
                                <p>Continue Raising your current mons to unlock this Mon for purchase.</p>
                            }
                        </div>
                    </div>}
            </div>
            <div>
              <div className='filter-block'>
                {<MultiSelect value={selectedStates} onChange={(e) => {renderMons = true;setSelectedStates(e.value)}} options={states} optionLabel="name" display="chip"
    placeholder="States" maxSelectedLabels={15} className="filter md:filter" />}
                {<MultiSelect value={selectedTypes} onChange={(e) => {renderMons = true;setSelectedTypes(e.value)}} options={types} optionLabel="name" display="chip"
    placeholder="Type" maxSelectedLabels={25} className="filter md:filter" />}
                {<MultiSelect value={selectedRegions} onChange={(e) => {renderMons = true;setSelectedRegions(e.value)}} options={regions} optionLabel="name" display="chip"
    placeholder="Region" maxSelectedLabels={15} className="filter md:filter" />}
                {<MultiSelect value={selectedShines} onChange={(e) => {renderMons = true;setSelectedShines(e.value)}} options={shines} optionLabel="name" display="chip"
            placeholder="Shine" maxSelectedLabels={15} className="filter md:filter" />}
              </div>
              <div className="Card-block">
                  {cards}
              </div>
            </div>
        </div>
  }
  
  //Returns the Gallery object, which would allow users to view trainer details and make purchases 
  return (
    <div className="Gallery">
        {menu[0] == "Gallery" ? 
          <div>
            <div className="Gallery-header">
              <button onClick={() => {menu[1]("Main-Menu")}}>Back Main Menu</button>
            </div>
            <div>
              <div className='filter'>
                {<MultiSelect value={selectedStates} onChange={(e) => {renderTrainers = true;setSelectedStates(e.value)}} options={states} optionLabel="name" display="chip"
    placeholder="States" maxSelectedLabels={15} className="filter md:filter" />}
                {<MultiSelect value={selectedRegions} onChange={(e) => {renderTrainers = true;setSelectedRegions(e.value)}} options={regions} optionLabel="name" display="chip"
    placeholder="Regions" maxSelectedLabels={15} className="filter md:filter" />}
                {<MultiSelect value={selectedClasses} onChange={(e) => {renderTrainers = true;setSelectedClasses(e.value)}} options={classes} optionLabel="name" display="chip"
    placeholder="Classes" maxSelectedLabels={15} className="filter md:filter" />}
              </div>
              <div className="Card-block">
                {cards}
              </div>
            </div>
          </div> : 
         menu[0] == "Gallery-Trainer" ? 
          <div>
            <div className="Gallery-header">
              <button onClick={switchToMainScreen}>Back to Gallery Main Screen</button>
            </div>
              {TrainerPage(currTrainer)}
          </div> :  
          <div>
            <div className="Gallery-header">
              <button onClick={switchToMainScreen}>Back to Gallery Main Screen</button>
            </div> 
            <div>Oops. Something broke :/</div>
          </div>
        }
    </div>
  );
}

export default Gallery;
