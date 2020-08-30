package GUI;

import javax.swing.*;

import java.awt.*;

public class Frame{
    public static void main(String[] args) {
        // Define Object
        JFrame f = new JFrame("Frame Title");
        JPanel p = new JPanel();
        JLabel mLabel, uLabel, pLabel;
        JTextField usertxt;
        JTextField passtxt;
        JButton b1, b2;
        Font fn1 = new Font("Tahoma",Font.BOLD,12);
        Font fn2 = new Font("Courier New",Font.BOLD,14);

        mLabel = new JLabel("Please enter your information");
        mLabel.setForeground(Color.BLUE);
        mLabel.setFont(fn1);
        uLabel = new JLabel("Username");
        uLabel.setFont(fn2);
        pLabel = new JLabel("Password");
        pLabel.setFont(fn2);
        usertxt = new JTextField(10);
        passtxt = new JTextField(10);
        b1 = new JButton("OK");
        b2 = new JButton("Cancel");
        b1.setFont(fn2);
        b2.setFont(fn2);


        //Binding Object
        p.setBackground(Color.GRAY);
        p.add(mLabel);
        p.add(uLabel);
        p.add(pLabel);
        p.add(usertxt);
        p.add(passtxt);
        p.add(b1);
        p.add(b2);

        f.add(p);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(250, 150);
        f.setVisible(true);
    }
}