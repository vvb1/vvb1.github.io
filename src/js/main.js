var $slider;
var game = {};

$(document).ready(function(){
    $slider = $('.slider');
    setGame();

    $('.js-start').on('click', function() {
        $('.slider__input').each(function(i, el) {
            if (!el.value.length) {
                $(el).addClass('Error');
                return false;
            } else {
                $(el).removeClass('Error');
            }

            if (i + 1 === $slider.find('.slider__input').length) {
                game.name = $('.slider__input')[0].value.trim().substring(0, 32);
                game.surname = $('.slider__input')[1].value.trim().substring(0, 32);
                game.current = 1;
                setGameToLocalStorage();
                $slider.slick('slickNext');
            }
        });
    });

    $('.slider__input').on('input', function() {
        $(this).removeClass('Error');
    });

    $('.js-button-correct, .js-button-wrong').on('click', function() {
        var $this = $(this);
        var questionIndex = $this.parents('.slider__item_question').index() - 1;
        var result;
        var className;
        var text;

        if($this.hasClass('js-button-correct')) {
            result = true;
            className = questionIndex % 2 ? 'correct1' : 'correct2';
            text = getGameFromLocalStorage().questions[questionIndex].correctText;
        } else {
            result = false;
            className = questionIndex % 2 ? 'wrong1' : 'wrong2';
            text = getGameFromLocalStorage().questions[questionIndex].wrongText;
        }

        $('.slider__item_answerresult').addClass(className);
        $('.slider__item_answerresult .slider__title').html('<span>' + (questionIndex + 1) + ' вопрос</span>' + text);
        game.questions[questionIndex].result = result;
        game.current = $slider.slick('slickCurrentSlide') + 1;
        setGameToLocalStorage();
        $slider.slick('slickGoTo', 8,  false);
    });

    $('.js-button-next').on('click', function() {
        var transform;

        $slider.slick('slickGoTo', 9,  false);

        switch(getGameFromLocalStorage().current) {
            case 2:
                transform = 'translate(126px, 40px)';
                break;
            case 3:
                transform = 'translate(206px, 110px)';
                break;
            case 4:
                transform = 'translate(142px, 180px)';
                break;
            case 5:
                transform = 'translate(67px, 251px)';
                break;
            case 6:
                transform = 'translate(112px, 331px)';
                break;
            case 7:
                transform = 'translate(167px, 410px)';
                break;
        }

        $('.marker').css('transition', 'all 1.5s ease').css('transform', transform);
        $('.slider__item_answerresult').removeClass('correct1 correct2 wrong1 wrong2');
    });

    $('.js-button-b').on('click', function() {
        game.questions[6].result = true;
        game.current = 10;

        $('.slider__item_answerresult').addClass('correct2');
        $('.slider__item_answerresult .slider__title').html('<span>7 вопрос</span>' + getGameFromLocalStorage().questions[6].correctText);
        $('.slider__item_answerresult .js-button-next').remove();
        $('.slider__item_answerresult').append('<div class="js-button-end slider__button slider__button_long">К результатам</div>');

        if(game.score === 0) {
                game.questions.forEach(function(el){
                    game.score = +game.score + +el.result;
                });

                firebase.database().ref('/gameover').once('value').then(function(snapshot) {
                    return snapshot.val();
                }).then(function(gameover) {
                    if(!gameover) {
                        pushUserResult();
                    }
                });


            }

        $('.slider__item_userresult .score').html(game.score + '<span>' + (game.score === 0 ? 'баллов' : game.score === 1 ? 'балл' : game.score < 5 ? 'баллa' : 'баллов') + '<span/>');
           
        buttonEndHandler();

        setGameToLocalStorage();
        $slider.slick('slickGoTo', 8,  false);

    });

    function buttonEndHandler() {
        $('.js-button-end').on('click', function() {
            
            $slider.slick('slickGoTo', 10,  false);
        });
    }

    buttonEndHandler();

    $('.js-button-gameresult').on('click', function() {
        var usersList = [];
        var scoretableHTML = '';
        var $scoretable = $('.scoretable');
        var gameover = false;

        firebase.database().ref('/gameover').once('value').then(function(snapshot) {
            return snapshot.val() || true;
        }).then(function(flag) {
            gameover = $('.js-button-gameresult').css('display', flag ? 'flex' : 'none');
        });

            if ($scoretable.html().length === 0) {
                firebase.database().ref('/users').once('value').then(function(snapshot) {
                        return snapshot.val() || {};
                    }).then(function(users) {
                        usersList = Object.keys(users).map(item => users[item]);

                        if (usersList.length > 0) {
                            usersList.sort(function(a, b) {
                                if (a.score < b.score) return 1;
                                if (a.score > b.score) return -1;
                                if (a.timestamp < b.timestamp) return -1;
                                if (a.timestamp > b.timestamp) return 1;
                                return 0;  
                            });

                            console.log(usersList);

                            usersList.forEach(function(el, i) {
                                if (i < 3) {
                                    scoretableHTML = $scoretable.html();
                                    var date = new Date(el.timestamp)
                                    var time = date.getHours() + ':' +
                                                (date.getMinutes()<10?'0':'') + date.getMinutes() + ':' +
                                                (date.getSeconds()<10?'0':'')  + date.getSeconds();

                                    $scoretable.html(scoretableHTML +
                                        '<div class="scoretable__content">' +
                                            '<div class="scoretable__item">' +
                                                '<span class="scoretable__name">' + el.fio + '</span>' +
                                                '<span class="scoretable__time">' +
                                                el.score + (el.score === 0 ? ' баллов' : el.score === 1 ? ' балл' : el.score < 5 ? ' баллa' : ' баллов') +
                                                ' — ' + time + '</span>' +
                                            '</div>'+
                                        '</div>');
                                } else {
                                    return;
                                }
                            });

                            $slider.slick('slickGoTo', 11,  false);
                        }
                    });
            } else {
                $slider.slick('slickGoTo', 11,  false);
            }
    });

    $('.marker').on('transitionend webkitTransitionEnd oTransitionEnd', function() {
        $slider.slick('slickGoTo', getGameFromLocalStorage().current,  false);
    });

    function pushUserResult() {
        firebase.database().ref('users/').push({
            fio: game.name + ' ' + game.surname,
            score: game.score,
            timestamp: +new Date()
          });
    }

    function setGameToLocalStorage() {
        localStorage.setItem('game', JSON.stringify(game));

        setMap();

        console.log(getGameFromLocalStorage());
    }

    function getGameFromLocalStorage() {
        return JSON.parse(localStorage.game);
    }

    function setMap() {
        $.each(getGameFromLocalStorage().questions, function(i, el){
            var $el = $('.map__button:nth-of-type(' + (i+1) + ')');

            if (el.result === true) {
                $el.addClass('correct');
            } else if (el.result === false) {
                $el.addClass('wrong');
            }
        });
    }

    function setGame() {
        game = {
            name: '',
            surname: '',
            questions: [
                {
                    result: null,
                    correctText: 'Верно!<p>Вы&nbsp;на&nbsp;правильном пути</p>',
                    wrongText: 'Неверно.<p>За&nbsp;готовой картой Клиенту надо будет приехать в&nbsp;офис</p>'
                },
                {
                    result: null,
                    correctText: 'Правильно!',
                    wrongText: 'Нет!<p>Заявок подано в&nbsp;два раза больше</p>'
                },
                {
                    result: null,
                    correctText: 'Правильно!',
                    wrongText: 'Неверно.<p>Заявок подано на&nbsp;сумму 540 млрд рублей</p>'
                },
                {
                    result: null,
                    correctText: 'Верно!<p>Сейчас только&nbsp;24%, но&nbsp;мы&nbsp;уверены, что общими усилиями их&nbsp;доля увеличится!</p>',
                    wrongText: 'Хотелось&nbsp;бы, но&nbsp;нет!<p>Функционал реализован для гарантий в&nbsp;рамках&nbsp;ФЗ</p>'
                },
                {
                    result: null,
                    correctText: 'Верно!',
                    wrongText: 'Неверный ответ.<p>У&nbsp;вас еще не&nbsp;было сделок по&nbsp;Белой зоне? Так будут!</p>'
                },
                {
                    result: null,
                    correctText: 'Верно!<p>Теперь СББОЛ стал еще оперативнее!</p>',
                    wrongText: 'Можно и так.<p>Но&nbsp;зачем тратить время, если СМС Клиенту поступит быстрее!</p>'
                },
                {
                    result: null,
                    correctText: 'Правильно!<p>Да, но&nbsp;нужно выполнить бизнес-план</p>',
                    wrongText: '',
                },
            ],
            current: 0,
            score: 0
        };

        if(!localStorage.game) {
            setGameToLocalStorage();
        } else {
            game = JSON.parse(localStorage.game);
        }

        $slider.slick({
            accessibility: false,
            arrows: false,
            infinite: false,
            fade: true,
            pauseOnFocus: false,
            pauseOnHover: false,
            swipe: false,
            touchMove: false,
            initialSlide: getGameFromLocalStorage().current,
        });

        firebase.database().ref('/gameover').once('value').then(function(snapshot) {
            return snapshot.val();
        }).then(function(gameover) {
            if(gameover) {
                $('.js-button-gameresult').css('display', 'flex');
            }
        });

        $('.slider__item_userresult .score').html(game.score + '<span>' + (game.score === 0 ? 'баллов' : game.score === 1 ? 'балл' : game.score < 5 ? 'баллa' : 'баллов') + '<span/>');
    }
});
