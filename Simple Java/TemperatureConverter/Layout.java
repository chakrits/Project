package TemperatureConverter;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;
import java.util.logging.Handler;

public class Layout extends JFrame {
    
    JPanel p = new JPanel();
    JLabel l1, l2, l3, l4;
    JComboBox tc1, tc2;
    JTextField t1, t2;
    JButton b, dot, ac, bs, pm;
    JButton n0, n1, n2, n3, n4, n5, n6, n7, n8, n9;

    public Layout(){
        
        Font fn = new Font("Courier New",Font.BOLD,16);
        JFrame f;
        JMenuBar menubar;
        JMenu menuFile, menuNew, menuAbout;
        JMenuItem menuOpen, menuExit, menuHelp;

        

        f = new JFrame("Temperature Converter");

        // Menu Bar
        menubar = new JMenuBar();
        menuFile = new JMenu("Home");
        menuNew = new JMenu("New");
        menuAbout = new JMenu("About");
        //End Menu Bar

        //Menu Item
        menuOpen = new JMenuItem("Open");
        menuExit = new JMenuItem("Exit");
        menuHelp = new JMenuItem("Help");
        //End Menu Item

        //* Set Font */
        menuFile.setFont(fn);
        menuNew.setFont(fn);

        menuOpen.setFont(fn);
        menuExit.setFont(fn);
        menuAbout.setFont(fn);
        menuHelp.setFont(fn);
        //End Set Font

        menuFile.add(menuNew);
        menuFile.addSeparator();
        menuFile.add(menuOpen);
        menuFile.add(menuExit);

        menuAbout.add(menuHelp);

        menubar.add(menuFile);
        menubar.add(menuAbout);
    
        f.add(setComp());

        f.setJMenuBar(menubar);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(400, 500);
        f.setVisible(true);
    }

    public JPanel setComp (){


        String arr1[] = { "Celsius", "Fahrenheit", "Kelvin", "Rankine", "Reaumur" };
        String arr2[] = { "Celsius", "Fahrenheit", "Kelvin", "Rankine", "Reaumur" };

        Font fn = new Font("Microsoft Sans Serif",Font.BOLD,14);



        l1 = new JLabel("To");
        l2 = new JLabel("Enter the Value:");
        l3 = new JLabel("Converted Value:");
        l4 = new JLabel("From");
        tc1 = new JComboBox(arr1);
        tc2 = new JComboBox(arr2);

        t1 = new JTextField();
        t2 = new JTextField();

        b = new JButton("Convert");
        dot = new JButton(".");
        pm = new JButton("±");
        bs = new JButton("<--");
        ac = new JButton("AC");
        n0 = new JButton("0");
        n1 = new JButton("1");
        n2 = new JButton("2");
        n3 = new JButton("3");
        n4 = new JButton("4");
        n5 = new JButton("5");
        n6 = new JButton("6");
        n7 = new JButton("7");
        n8 = new JButton("8");
        n9 = new JButton("9");


        l1.setFont(fn);
        l2.setFont(fn);
        l3.setFont(fn);
        l4.setFont(fn);
        tc1.setFont(fn);
        tc2.setFont(fn);

        p.setLayout(null);
        tc1.setBounds(75, 50, 100, 20);
        t1.setBounds(200, 50, 100, 20);
        l1.setBounds(100, 75, 50, 20);
        l4.setBounds(90, 25, 50, 20);
        l2.setBounds(200, 35, 100, 20);
        l3.setBounds(200, 85, 100, 20);
        tc2.setBounds(75, 100, 100, 20);
        t2.setBounds(200, 100, 100, 20);
        b.setBounds(138, 150, 100, 20);
        ac.setBounds(238, 200, 50, 100);
        pm.setBounds(238, 350, 50, 50);
        bs.setBounds(238, 300, 50, 50);
        dot.setBounds(188, 350, 50, 50);
        n0.setBounds(88, 350, 100, 50);
        n1.setBounds(88, 200, 50, 50);
        n2.setBounds(138, 200, 50, 50);
        n3.setBounds(188, 200, 50, 50);
        n4.setBounds(88, 250, 50, 50);
        n5.setBounds(138, 250, 50, 50);
        n6.setBounds(188, 250, 50, 50);
        n7.setBounds(88, 300, 50, 50);
        n8.setBounds(138, 300, 50, 50);
        n9.setBounds(188, 300, 50, 50);


        p.add(tc1);
        p.add(tc2);
        p.add(l1);
        p.add(l2);
        p.add(l3);
        p.add(l4);
        p.add(t1);
        p.add(t2);
        p.add(b);
        p.add(ac);
        p.add(dot);
        p.add(pm);
        p.add(bs);
        p.add(n0);
        p.add(n1);
        p.add(n2);
        p.add(n3);
        p.add(n4);
        p.add(n5);
        p.add(n6);
        p.add(n7);
        p.add(n8);
        p.add(n9);
        t2.setEditable(false);

        return p;
    }



}

