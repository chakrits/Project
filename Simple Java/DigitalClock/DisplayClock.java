package DigitalClock;

import javax.print.attribute.SetOfIntegerSyntax;
// Import essential package
import javax.swing.*;
import javax.swing.plaf.synth.SynthInternalFrameUI;

import DemoClock.Frame;

import java.awt.*;


public class DisplayClock {

    private JFrame f;
    private JPanel p;

    public DisplayClock ()
    {
        ClockDisplay clock = new ClockDisplay();

         f = new JFrame("Digital Clock");;
         p = new JPanel();
         p = setPanel(p);
         f = setFrame(f);

    }

    private JFrame setFrame (JFrame f)
    {
        f.add(p);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(250, 200);
        f.setVisible(true);
        return f;
    }

    private JPanel setPanel (JPanel p)
    {
        p.setBackground(Color.GRAY);
        return p;
    }
}

