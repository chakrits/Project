package GUI;

import javax.naming.ldap.ManageReferralControl;
import javax.swing.*;
import java.awt.*;

public class Layout {
    public static void main(String[] args) {
        Font fn = new Font("Microsoft Sans Serif",Font.BOLD,14);
        JFrame f = new JFrame("GUI Layout");
        JPanel p = new JPanel();
        p.setLayout(new GridLayout(5,2));

        JButton b1 = new JButton("One");
        JButton b2 = new JButton("Two");
        JButton b3 = new JButton("Three");
        JButton b4 = new JButton("Four");
        JButton b5 = new JButton("Five");
        JButton b6 = new JButton("Six");
        JButton b7 = new JButton("Seven");
        JButton b8 = new JButton("Eight");
        JButton b9 = new JButton("Nine");
        
        b1.setFont(fn);
        b2.setFont(fn);
        b3.setFont(fn);
        b4.setFont(fn);
        b5.setFont(fn);
        b6.setFont(fn);
        b7.setFont(fn);
        b8.setFont(fn);
        b9.setFont(fn);
        
        p.add(b1);
        p.add(b2);
        p.add(b3);
        p.add(b4);
        p.add(b5);
        p.add(b6);
        p.add(b7);
        p.add(b8);
        p.add(b9);
        f.add(p);

        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(200, 180);
        f.setVisible(true);


    }
}