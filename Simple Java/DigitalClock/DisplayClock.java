package DigitalClock;

import javax.print.attribute.SetOfIntegerSyntax;
// Import essential package
import javax.swing.*;
import javax.swing.plaf.synth.SynthInternalFrameUI;
import java.awt.*;


public class DisplayClock extends JFrame {

    private JPanel p;
    private ClockDisplay clock ;

    public DisplayClock ()
    {

         p = new JPanel();
         p.setLayout(new BorderLayout());
         p.setBackground(Color.GRAY);


         ClockDisplay clock = new ClockDisplay();
         clock.setTime(15, 00, 00); 
         JLabel mLabel = new JLabel(clock.getTime(),SwingConstants.CENTER);
         mLabel.setOpaque(true);
         
         clock.minIncrement();
         mLabel.setText(clock.getTime());

         p.add(mLabel);
         
         add(p);

    }


}

