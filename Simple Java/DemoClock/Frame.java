package DemoClock;


// Import essential package
import javax.swing.*;
import java.awt.*;

public class Frame {
    
    public Frame (String txt) {
        Font fn = new Font("Courier New",Font.BOLD,16);
        JFrame f;
        JPanel p = new JPanel();
        JMenuBar menubar;
        JMenu menuFile, menuNew, menuAbout;
        JMenuItem menuN1, menuN2, menuOpen, menuExit;

        JLabel mLabel = new JLabel(txt,SwingConstants.CENTER);
        mLabel.setFont(fn);
        mLabel.setOpaque(true);
        

        f = new JFrame("Menubar");
        menubar = new JMenuBar();
        menuFile = new JMenu("File");
        menuNew = new JMenu("New");
        menuAbout = new JMenu("About");
    
        menuN1 = new JMenuItem("Java");
        menuN2 = new JMenuItem("C/C++");
    
        menuNew.add(menuN1);
        menuNew.addSeparator();
        menuNew.add(menuN2);
    
        menuOpen = new JMenuItem("Open");
        menuExit = new JMenuItem("Exit");
    
        menuFile.setFont(fn);
        menuNew.setFont(fn);
        menuN1.setFont(fn);
        menuN2.setFont(fn);
        menuOpen.setFont(fn);
        menuExit.setFont(fn);
        menuAbout.setFont(fn);
    
        menuFile.add(menuNew);
        menuFile.addSeparator();
        menuFile.add(menuOpen);
        menuFile.add(menuExit);
    
        menubar.add(menuFile);
        menubar.add(menuAbout);

        p.add(mLabel);
        p.setBackground(Color.GRAY);
        f.add(p);

        f.setJMenuBar(menubar);
        f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        f.setSize(250, 200);
        f.setVisible(true);
    }


}
