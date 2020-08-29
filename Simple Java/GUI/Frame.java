package GUI;

import javax.swing.*;
import java.awt.*;

public class Frame{
    public static void main(String[] args) {
        // Define Object
        JFrame f = new JFrame("Frame Title");
        JPanel p = new JPanel();
        JButton b1 = new JButton("Click");

        //Binding Object
        p.setBackground(Color.WHITE);
        p.add(b1);

        f.add(p);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(200, 200);
        f.setVisible(true);
    }
}