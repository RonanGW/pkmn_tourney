import React, { useState, useEffect } from 'react'
import './Fight.css'
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface Fight {
  menu: any[]
  trainers: any[]

}

interface mon {
  state: string;
  lvl: number;
  xp: number;
  hp: number;
  atk: number;
  cost: number;
}

interface trainer {
    name: string;
    state: string;
    region: string;
    class: string;
    w: number;
    l: number;
    BP: number;
    mons: object
};


function Fight({menu, trainers}: Fight) {
    const [allTrainers, setAllTrainers] = useState<[string,trainer][]>(Object.entries(trainers[0]));
    const [remainingTrainers, setRemainingTrainers] = useState<[string,trainer][]>((allTrainers).filter((t) => t[1].state == "Hidden"))
    let tmp = remainingTrainers.sort(() => 0.5 - Math.random())
    tmp = remainingTrainers.slice(0, 8)


    const x = useMotionValue(0);
    const rotate = useTransform(x, [-150, 150], [-90, 90]);
    const angle = 360 / 16;
    const rotation = React.useRef(angle);
    let divs = [];
  
    for (let [tkey,value] of tmp) {
        rotation.current = rotation.current + angle
        let imgURL='./chars/ppl/'+ value.name.toLowerCase()+'.png'

        divs.push(
        <div
        style={{
            transform: `rotate(${rotation.current}deg)
                        translate(${250}px)
                        rotate(${rotation.current * -1}deg)
                        ${trainers[0]["red"].name === value.name ? 'scale(1.5)' : ''}`,
            margin: '-40px',
          }}
        ><img src={imgURL}></img></div>)
        }

    return (
    <div>
        <div className="Gallery-header">
            <button onClick={() => {menu[1]("Main-Menu")}}>Back Main Menu</button>
        </div>

        <motion.div
            style={{
            rotate: rotate,
            }}
            className="relative border border-4 border-red-900 rounded-full h-[500px] w-[500px] bg-red-200"
            >

            {divs}
            
        </motion.div>
    </div>
    )
}

export default Fight