package DigitalClock;

import javax.swing.JFrame;

public class MainClock {
    
    public static void main(String[] args)
    {
        DisplayClock dpClock = new DisplayClock();
        dpClock.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        dpClock.setSize(350, 250);
        dpClock.setVisible(true);

    }
}



